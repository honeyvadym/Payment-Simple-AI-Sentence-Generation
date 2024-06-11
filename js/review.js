$(function () {
  // setAvatar();
  initMsg();
  //getOptions();
  $(".se-pre-con").fadeOut("slow");
});

let options;
var allTemplates = null;
var speed = 25;
var currentTemplateId = null;
var clickEvenKey = false;
var isReportEdited = false;
window.jsPDF = window.jspdf.jsPDF;
var pdf_doc = new jsPDF("p", "mm", "a4");
var isReportEdited = false;

function initMsg() {
  var result = getJsonFromUrl();
  if (result.success != undefined && result.name != undefined) {
    var name = result.name;
    var msg = `Client <strong>${name}</strong> added successfully`;
    $("#msg").html(msg);
    $("#alert").removeClass("hidden").addClass("show");
    $("#alert .alert").removeClass("hidden").addClass("show");
  }
}

function getOptions() {
  $.ajax({
    url: "https://api.toddles.cloud/options",
    type: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.error == undefined) {
        $(".se-pre-con").fadeOut("slow");
        let html = "";
        const { options } = response;
        for (let i = 0; i < options.length; i++) {
          const option = options[i];
          html += `<label htmlFor="${option.name}">${option.name}:</label>
          <select id="${option.name}">`;
          for (let j = 0; j < option.options.length; j++) {
            const child = option.options[j];
            const isSelected = child === option?.default ? "selected" : "";
            html += `<option key="${j}" value="${child}" ${isSelected}>${child}</option>`;
          }
          html += "</select>";
        }
        $("#options-box").html(html);
      } else {
        console.log("getOptions", response);
        // localStorage.clear();
        // localStorage.setItem("error", "Try again");
        // window.location.href="./login.html";
      }
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function process() {
  const selectedOptions = $("#options-box select")
    .map(function () {
      return { name: $(this).attr("id"), value: $(this).val() };
    })
    .get();
  const inputQuery = $("#myTextarea").text().trim();
  if (selectedOptions && inputQuery && inputQuery.length > 200) {
    $(".se-pre-con").fadeIn("slow");
    $.ajax({
      url: "https://api.toddles.cloud/revise",
      type: "POST",
      data: JSON.stringify({
        options: selectedOptions,
        input_query: inputQuery,
      }),
      headers: {
        Authorization: getAuthHeader(),
      },
      success: function (response) {
        if (response.success) {
          $("#exportTextarea").removeClass("hidden");
          $("#export-btn-box").removeClass("hidden");
          $("#exportTextarea").html(translateDOM(response.response));
          textareaAutoResize($(".report-result-content")[0]);
          $("#exportTextarea").addClass("noEdit").attr("contenteditable", false);
          $(".se-pre-con").fadeOut("slow");
          options = response;
          console.log("process", response);
        } else {
          console.log("process", response);
        }
      },
      error: function (jqXHR, exception) {
        redirectAjaxError(jqXHR);
        let msgTxt = "";
        switch (jqXHR.status) {
          case 400:
            msgTxt = "Erorr:Bad Request.";
            break;
          case 401:
            msgTxt = "Erorr:Token expired, please sign in again.";
            break;
          case 402:
            msgTxt = "Insufficient credits, please refill!";
            break;
          case 404:
            msgTxt = "Not Found:Server cannot find the requested URL";
            break;
          case 500:
            msgTxt = "Error:Internal Server Error";
            break;
          default:
            msgTxt = "Error";
            break;
        }
        $("#msg_drafts_error").html(msgTxt);

        $("#alert_drafts_error")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        $("#alert_drafts_error .alert")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        close_alert_after_5();
      },
    });
  } else if (selectedOptions && inputQuery.length < 200) {
    $("#msg_drafts_error").html(
      "Please provide more details. Your content must be greater than 200 characters."
    );
    $("#alert_drafts_error").removeClass("hidden").addClass("show").fadeIn();
    $("#alert_drafts_error .alert")
      .removeClass("hidden")
      .addClass("show")
      .fadeIn();
    close_alert_after_5();
  } else {
    $("#msg_drafts_error").html("Error! Please fill out all input tags.");
    $("#alert_drafts_error").removeClass("hidden").addClass("show").fadeIn();
    $("#alert_drafts_error .alert")
      .removeClass("hidden")
      .addClass("show")
      .fadeIn();
    close_alert_after_5();
  }
}

function reset() {
  $(".se-pre-con").fadeIn();
  $("#options-box").removeClass("hidden");
  $("#process-btn-box").removeClass("hidden");
  $("#export-btn-box").addClass("hidden");
  $("#exportTextarea").addClass("hidden");
  $("#myTextarea").html("");
  textareaAutoResize($(".report-result-content")[0]);
  $(".se-pre-con").fadeOut("slow");
}

function genHtml(options) {
  let html = ``;
  options.map((item) => {
    // var name = getName(item.name);
    html += `
            <tr data-name='${item.name}' data-id='${item.id}'>
                <td>${item.first_name}</td>
                <td>${item.last_name}</td>
                <td>
                    <div class="d-flex btn-group gap-3">
                        <button type="button" class="btn btn-success btn-select btn-start-session">
                            <span class="fa fa-fw fa-play mr-2"></span>Session
                        </button>
                        <button type="button" class="btn btn-info btn-select btn-review-notes">
                            <span class="fa fa-fw fa-folder mr-2"></span>Notes
                        </button>
                        <button type="button" class="btn btn-info btn-select btn-generate-report">
                            <span class="fa fa-fw fa-file mr-2"></span>Reports
                        </button>
                        <button type="button" class="btn btn-danger btn-select btn-delete-client" onclick="confirmDeleteClient('${item.id}')">
                            <span class="fa fa-fw fa-trash mr-2"></span>Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
  });
  $("#table tbody").html(html);
}

function getName(str) {
  var units = str.split(" ");
  if (units.length == 2) {
    return {
      firstName: units[0],
      lastName: units[1],
    };
  } else {
    return {
      firstName: str,
      lastName: "",
    };
  }
}

$(document).ready(function () {
  $("table tbody").on(
    "click",
    "button.btn-select:not(.btn-delete-client)",
    function () {
      $(".se-pre-con").fadeIn("slow");
      var client_name = $(this).parents("tr").data("name");
      var client_id = $(this).parents("tr").data("id");

      localStorage.setItem("client_name", client_name);
      localStorage.setItem("client_id", client_id);
      setTimeout(function () {
        $(".se-pre-con").fadeOut("slow");
      }, 200);
      if ($(this).hasClass("btn-start-session")) {
        window.location.href = "./session.html";
      }
      if ($(this).hasClass("btn-review-notes")) {
        window.location.href = "./notes.html";
      }
      if ($(this).hasClass("btn-generate-report")) {
        window.location.href = "./report.html";
      }
    }
  );
});

$("#guide").click(function () {
  createVideoModal("client");
  $("#guideModal").modal({
    backdrop: "static",
    keyboard: true,
  });
});

function translateDOM(str) {
  return str.replace(/\n/g, "<br>");
}

async function exportHTML(type, filename = "") {
  var $el = $(".report-result-content").clone(true, false);
  // $el.find(".non-export").remove();
  $el.removeClass("shadow-box");
  $el.css("border", "none");
  // var content = "<div>" + $(".report-result-content").html() + "</div>";
  // var timeStamp = new Date(Number(localStorage.getItem('draft_time')) * 1000);
  // var date = timeStamp.getFullYear() + "-" + (timeStamp.getMonth() + 1) + "-" + timeStamp.getDate();
  var date = $("#page_subtitle").text();
  var clientName = localStorage.getItem("client_name")
    ? localStorage.getItem("client_name").replace(" ", "-")
    : "no-name";
  if (type == "doc") {
    var preHtml =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
    var postHtml = "</body></html>";
    var html =
      preHtml + "<div>" + $(".report-result-content").html() + "</div>";
    +postHtml;

    var blob = new Blob(["\ufeff", html], {
      type: "application/msword",
    });

    // Specify link url
    var url =
      "data:application/vnd.ms-word;charset=utf-8," + encodeURIComponent(html);

    // Specify file name
    filename = filename
      ? filename + ".doc"
      : "report-export-" + clientName + "-" + date + ".doc";

    // Create download link element
    var downloadLink = document.createElement("a");

    document.body.appendChild(downloadLink);

    if (navigator.msSaveOrOpenBlob) {
      navigator.msSaveOrOpenBlob(blob, filename);
    } else {
      // Create a link to the file
      downloadLink.href = url;

      // Setting the file name
      downloadLink.download = filename;

      //triggering the function
      downloadLink.click();
    }

    document.body.removeChild(downloadLink);
  }

  if (type === "pdf") {
    const element = document.querySelector(".report-result-content");
    let y = 20; // Starting y position

    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const lines = pdf_doc.splitTextToSize(
          child.textContent.trim(),
          pdf_doc.internal.pageSize.getWidth() - 40
        );
        for (let line of lines) {
          if (y > 280) {
            pdf_doc.addPage();
            y = 20;
          }

          // Optionally set font, font size, and other properties
          pdf_doc.setFontSize(12);
          pdf_doc.setFont("times");

          pdf_doc.text(line, 20, y);

          y += 8; // Adjust line spacing
        }
      } else if (child.tagName === "BR") {
        y += 3;
      } else if (child.tagName === "IMG") {
        const imgData = await getImageBase64(child.src, child.width, 600);
        if (y + child.height / 4 > 280) {
          pdf_doc.addPage();
          y = 20;
        }
        pdf_doc.addImage(
          imgData,
          "JPEG",
          20,
          y,
          child.width / 4,
          child.height / 4
        );
        y += child.height / 4 + 10;
      }
    }
    filename = filename
      ? filename + ".pdf"
      : "report-export-" + clientName + "-" + date + ".pdf";

    pdf_doc.save(filename);
  }
  $el.remove();
}
