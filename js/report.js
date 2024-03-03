var REPORT_TYPES = {
  gp: "GP Letter (default)",
};
window.jsPDF = window.jspdf.jsPDF;
var pdf_doc = new jsPDF("p", "mm", "a4");
var isReportEdited = false;

var DOC_STATUS_TYPE = {
  INITIATED: "initiated",
  PROCESSING: "processing",
  AVAILABLE: "available",
  APPROVED: "approved",
  ERROR: "error",
};

var REPORT_STATUS_TYPE = {
  INITIATED: "initiated",
  PROCESSING: "processing",
  AVAILABLE: "available",
  ERROR: "error",
};

$(function () {
  getClients();
  getTemplates();
  getNotes();
  getDrafts();
  getBlocks();
  setAvatar();

  $(".report-doc-report-title").on("focus", function () {
    $(this).select();
  });
});

function getClients() {
  if (localStorage.getItem("client_name") == null) {
    window.location.href = "./dashboard.html";
  }
  $.ajax({
    url: "https://toddles-api.phantominteractive.com.au/clients",
    type: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.error === undefined) {
        var html = `
					<button id="filterClients" class="btn" type="button" style="display: none; position: absolute;">
						<input type="text" id="clientSearchInput" placeholder="Search Client..." oninput="filterClients()">
						<button id="closeClientsDropdown" class="btn" data-toggle="dropdown" type="button" onclick="closeDropDown()" style="display: none; position: absolute;">&times;</button>
					</button>
					<button id="currentClient" class="btn dropdown-toggle" type="button" data-toggle="dropdown" onclick="openDropDownSearch()">
						${localStorage.getItem("client_name")}
						<span class="caret"></span>
					</button>
				`;
        html += `<ul class="dropdown-menu">`;
        response.map((item) => {
          html += `<li onclick="selectClient('${item.name}', '${item.id}')">${item.name}</li>`;
        });
        html += `</ul>`;
        $("div.client-dropdown").html(html);

        $("#clientSearchInput").on("keyup", function (event) {
          if (event.key === "Escape") {
            closeDropDown();
          }
        });
      } else {
        console.log(response.error);
      }
      $(".se-pre-con").fadeOut("slow");
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function openDropDownSearch() {
  $("#filterClients").show();
  $("#closeClientsDropdown").show();
  setTimeout(function () {
    $("#clientSearchInput").focus();
  });
}

function closeDropDown() {
  $("#filterClients").hide();
  $("#closeClientsDropdown").hide();
  $("#clientSearchInput").val("");
  filterClients();
}

$(".client-dropdown").on("hide.bs.dropdown", function () {
  closeDropDown();
});

function selectClient(clientName, clientId) {
  localStorage.setItem("client_name", clientName);
  localStorage.setItem("client_id", clientId);
  window.location.reload();
}
var speed = 25;
var allDocs = null;
var allBlocks = null;
var currentDraftId = null;
var clickEvenKey = false;
function getNotes() {
  $.ajax({
    url: `https://toddles-api.phantominteractive.com.au/docs?client=${localStorage.getItem(
      "client_id"
    )}`,
    type: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.success) {
        allDocs = response.docs;
        if (!response.docs.length) {
          $("#btn_create_report").attr("disabled", true);
        }
      } else {
        console.error(response);
      }
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function filterClients() {
  var input, filter, ul, li, i, txtValue;
  input = document.getElementById("clientSearchInput");
  filter = input.value.toUpperCase();
  ul = document.querySelector(".dropdown-menu"); // Assuming this is your dropdown
  li = ul.getElementsByTagName("li");
  for (i = 0; i < li.length; i++) {
    txtValue = li[i].textContent || li[i].innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = "";
    } else {
      li[i].style.display = "none";
    }
  }
}

function getDrafts() {
  $.ajax({
    url: `https://toddles-api.phantominteractive.com.au/drafts?client=${localStorage.getItem(
      "client_id"
    )}`,
    type: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.success) {
        $("#table_drafts").removeClass("hidden");
        var $tbody = $("#table_drafts tbody");
        $tbody.html("");
        if (response.drafts.length) {
          response.drafts.map((draft) => {
            $tbody.append(`
							<tr>
								<td>${draft.title}</td>
								<td>${draft.date}</td>
								<td>
									${
                    draft.status == REPORT_STATUS_TYPE.AVAILABLE
                      ? `<div class="btn-group"> 
											<button class="btn btn-info btn-select mr-4" onclick="goReportResultPage(null, '${draft.title}', '${draft.id}')">
												<span class="fa fa-fw fa-file mr-2"></span>Edit
											</button>
											<button class="btn btn-danger btn-select" onclick="confirmDeleteReport('${draft.id}')">
												<span class="fa fa-fw fa-trash mr-2"></span>Delete
											</button>
										</div>`
                      : ``
                  }
									${
                    draft.status == REPORT_STATUS_TYPE.ERROR
                      ? `<button class="btn btn-danger btn-select" onclick="confirmDeleteReport('${draft.id}')">
											<span class="fa fa-fw fa-trash mr-2"></span>Delete
										</button>`
                      : ``
                  }
								</td>
								<td>
									${
                    draft.status == REPORT_STATUS_TYPE.PROCESSING
                      ? `<img class='spinner' src='./images/spinner.svg'>`
                      : ``
                  }
									${
                    draft.status == REPORT_STATUS_TYPE.ERROR
                      ? `<i class='error-doc-icon fa-solid fa-circle-xmark'></i>`
                      : ``
                  }
								</td>
							</tr>
						`);
          });
        } else {
          $("#alert_drafts_info")
            .removeClass("hidden")
            .addClass("show")
            .fadeIn();
          $("#alert_drafts_info .alert")
            .removeClass("hidden")
            .addClass("show")
            .fadeIn();
          close_alert_after_5();
          $("#table_drafts").addClass("hidden");
        }
      } else {
        console.error(response);
      }
      $(".report-load-icon").fadeOut();
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function goBackToDrafts() {
  if (isReportEdited) {
    $("#confirmModal").modal({
      backdrop: "static",
    });
    return;
  }
  showDraftList();
}

function showDraftList() {
  $("#blockListButton").hide();
  setTimeout(() => {
    isReportEdited = false;
    $("#btn_create_report").removeClass("hidden");
    $(".report-page-drafts-section").removeClass("hidden");
    $(".report-docs-section").addClass("hidden");
    $(".report-result-section").addClass("hidden");
    setPageHeader(true);
    getDrafts();
    $(".report-docs-section .alert-backdrop")
      .removeClass("show")
      .addClass("hidden");
    $(".report-docs-section .alert").removeClass("show").addClass("hidden");
    $(".report-result-section .alert-backdrop")
      .removeClass("show")
      .addClass("hidden");
    $(".report-result-section .alert").removeClass("show").addClass("hidden");
  }, 50);
}

function getBlocks() {
  $.ajax({
    url: `https://toddles-api.phantominteractive.com.au/blocks`,
    type: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.blocks) {
        allBlocks = [];
        for (let i = 0; i < Object.keys(response.blocks).length; i++) {
          allBlocks[i] = Object.keys(response.blocks)[i];
        }
      } else {
        console.error(response);
      }
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function getPrompt(blockName, reportId) {
  return new Promise(function (resolve, reject) {
    if (blockName && reportId) {
      $.ajax({
        url: `https://toddles-api.phantominteractive.com.au/prompt?query=${blockName}&id=${reportId}`,
        timeout: 60000,
        type: "GET",
        headers: {
          Authorization: getAuthHeader(),
        },
        success: function (response) {
          if (response.success) {
            resolve(translateDOM(response.response));
          } else {
            console.error(response);
            reject(false);
          }
        },
        error: function (jqXHR, exception) {
          redirectAjaxError(jqXHR);
          reject(false);
        },
      });
    } else {
      reject(false);
    }
  });
}

function getCustomPrompt() {
  $("#get_prompt img").show();
  $("#get_prompt").prop("disabled", true);
  $("#custom_block_name").prop("disabled", true);
  $("#myTextarea").addClass("noEdit").attr("contenteditable", false);
  $("#blockListButton img").show();
  $.ajax({
    url: `https://toddles-api.phantominteractive.com.au/prompt?query=custom%7C${$(
      "#custom_block_name"
    ).val()}&id=${currentDraftId}`,
    type: "GET",
    timeout: 60000,
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.success) {
        var prompt = translateDOM(response.response);
        var i = 0;
        var newWord = "";
        function typeWriter() {
          if (i < prompt.length) {
            newWord += prompt.charAt(i);
            $("#myTextarea .custom_block").html(newWord);
            i++;
            setTimeout(typeWriter, speed);
            textareaAutoResize($(".report-result-content")[0], false, true);
          } else {
            $(".custom_block").hide();
            $(".custom_block").before(prompt);
            $(".custom_block").before($("<br><br>"));
            $("#myTextarea")
              .removeClass("noEdit")
              .attr("contenteditable", true);
            $(".custom_block").remove();
            $("#blockListButton img").hide();
            textareaAutoResize($(".report-result-content")[0], false, true);
          }
        }
        typeWriter();
      } else {
        console.error(response);
      }
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
      $("#get_prompt img").hide();
      $("#get_prompt").prop("disabled", false);
      $("#custom_block_name").prop("disabled", false);
      $("#myTextarea").removeClass("noEdit").attr("contenteditable", true);
      $("#blockListButton img").hide();
    },
  });
}

$(".btn-confirm").click(function () {
  showDraftList();
});

function goReportResultPage(result, title, draftID) {
  $(".report-load-icon").css("display", "");
  $("#btn_create_report").addClass("hidden");
  $(".drafts-box .alert-backdrop").removeClass("show").addClass("hidden");
  $(".drafts-box .alert").removeClass("show").addClass("hidden");

  if (draftID == undefined || draftID == null) {
    $(".btn-save-report").data("report-id", result.id);
    setPageHeader(false, title, result.date);
    $(".report-result-title").html(title);
    $(".report-result-date").html(result.date);
    $(".report-result-type").html(REPORT_TYPES[result.type]);
    var $ul = $("ul.report-result-docs");
    $ul.html("");
    var selectedDocs = result.docs.split(",");
    selectedDocs.map((docID) => {
      var doc = allDocs.find((item) => item.id == docID);
      $ul.append(`
				<li class='report-result-doc-item'>
					<span>${doc.title}</span>
					<span class="ml-auto">${doc.date}</span>
				</li>
			`);
    });
    $(".report-result-content").html(translateDOM(result.content));
    textareaAutoResize($(".report-result-content")[0], false, true);
    $(".report-load-icon").fadeOut();
  } else {
    $(".btn-save-report").data("report-id", draftID);

    $.ajax({
      url: `https://toddles-api.phantominteractive.com.au/draft?id=${draftID}`,
      type: "GET",
      headers: {
        Authorization: getAuthHeader(),
      },
      success: function (response) {
        if (response.success) {
          currentDraftId = draftID;
          setPageHeader(false, title, response.draft.date);
          // localStorage.setItem('draft_time', response.draft.timestamp);
          $(".report-result-title").html(title);
          $(".report-result-date").html(response.draft.date);
          $(".report-result-type").html(REPORT_TYPES[response.draft.type]);
          var $ul = $("ul.report-result-docs");
          var $ul_block = $("ul.block-list");
          $ul_block.html("");
          if (allBlocks && allBlocks.length) {
            allBlocks.map((block) => {
              $ul_block.append(`
									<li data-report-id='${draftID}' data='${block}' class='block-list-item btn'>
										<span class="block">${block}</span>
									</li>
								`);
            });
          }
          $ul.html("");
          var selectedDocs = response.draft.docs.split(",");
          selectedDocs.map((docID) => {
            if (allDocs) {
              var doc = allDocs.find((item) => item.id == docID);
              if (doc) {
                $ul.append(`
									<li class='report-result-doc-item'>
										<span>${doc.title}</span>
										<span class="ml-auto">${doc.date}</span>
									</li>
								`);
              }
            }
          });
          $(".report-result-content").html(
            translateDOM(response.draft.content)
          );
          textareaAutoResize($(".report-result-content")[0], false, true);
          blockDragStart();
        } else {
          console.error(response);
        }
        $(".report-load-icon").fadeOut();
      },
      error: function (jqXHR, exception) {
        redirectAjaxError(jqXHR);
      },
    });
  }

  isReportEdited = false;
  $(".report-page-drafts-section").addClass("hidden");
  $(".report-docs-section").addClass("hidden");
  $(".report-result-section").removeClass("hidden");
}

function saveReport() {
  $("#blockListButton").hide();
  setTimeout(() => {
    $(".report-load-icon").css("display", "");
  }, 10);
  $.ajax({
    url: `https://toddles-api.phantominteractive.com.au/save`,
    type: "POST",
    headers: {
      Authorization: getAuthHeader(),
    },
    data: JSON.stringify({
      id: $(".btn-save-report").data("report-id"),
      content: $(".report-result-content").html(),
    }),
    success: function (response) {
      if (response.success) {
        $("#alert_report_result_success")
          .removeClass("hidden")
          .addClass("show");
        $("#alert_report_result_success .alert")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
      } else {
        $("#alert_report_result_error").removeClass("hidden").addClass("show");
        $("#alert_report_result_error .alert")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        $(".alert_report_result_error_msg").text(
          "Error! " + response.error ? response.error : "An error occured."
        );
        console.error(response);
      }
      isReportEdited = false;
      $(".report-load-icon").fadeOut();
      setTimeout(() => {
        $("#blockListButton").show();
      }, 500);
      close_alert_after_5();
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function showReportDocAlert(status, msg) {
  var $alertEl = $(".report-docs-section").find(`#alert_report_doc_${status}`);
  var $messageEl = $alertEl.find("span").eq(0);
  $alertEl.removeClass("hidden").addClass("show").fadeIn();
  close_alert_after_5();
  if (msg) {
    $messageEl.html(msg);
  }
}

function toogleArrowIcon(el) {
  var $i = $(el).find("i");
  if ($i.hasClass("fa-chevron-down")) {
    $i.removeClass("fa-chevron-down").addClass("fa-chevron-up");
  } else {
    $i.removeClass("fa-chevron-up").addClass("fa-chevron-down");
  }
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

async function getImageBase64(url, maxWidth, maxHeight) {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");

      // Calculate the scaling factor to resize the image
      let scaleFactor = Math.min(maxWidth / img.width, maxHeight / img.height);
      let newWidth = img.width * scaleFactor;
      let newHeight = img.height * scaleFactor;

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Fill the canvas with a white background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, newWidth, newHeight);

      // Draw the image onto the canvas
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      resolve(canvas.toDataURL("image/jpeg", 0.7)); // Adjust the quality for further size reduction
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

function translateDOM(str) {
  return str.replace(/\n/g, "<br>");
}

function createNewReport() {
  $("#btn_create_report").addClass("hidden");
  $(".report-page-drafts-section").addClass("hidden");
  $(".report-docs-section").removeClass("hidden");
  $(".report-result-section").addClass("hidden");
  $("#blockListButton").hide();
  $(".drafts-box .alert-backdrop").removeClass("show").addClass("hidden");
  $(".drafts-box .alert").removeClass("show").addClass("hidden");

  var $ul = $("ul.report-docs-list");
  $ul.html("");
  allDocs.map((doc) => {
    $ul.append(`
			<li class='report-docs-item ${
        doc.status == DOC_STATUS_TYPE.APPROVED ? "" : "inactive"
      }'>
				<input 
				data-doc-id="${doc.id}"
				class="form-control" type="checkbox" 
				${doc.status == DOC_STATUS_TYPE.APPROVED ? "" : "disabled"}>
				<div class="d-flex gap-4">
					${doc.title} 
					${
            doc.status == DOC_STATUS_TYPE.PROCESSING ||
            doc.status == DOC_STATUS_TYPE.AVAILABLE
              ? "<img class='docs-detail-list-img' src='./images/spinner.svg'>"
              : ""
          }
					${
            doc.status == DOC_STATUS_TYPE.ERROR
              ? "<i class='error-doc-icon fa-solid fa-circle-xmark'></i>"
              : ""
          }
				</div>
				<div class="ml-auto">${doc.date}</div>
			</li>
		`);
  });
}

$("ul.report-docs-list").on("click", "li:not(.inactive)", function (e) {
  var $input = $(this).find("input");
  if (e.target == $input) {
    return;
  }
  $input.prop("checked", !$input.prop("checked"));
});

function sendCreateReportRequest() {
  var $checkedInputs = $(".report-docs-list").find("input:checked");
  if (!$checkedInputs.length) {
    showReportDocAlert("warning");
    return;
  }
  if (!$(".report-doc-report-title").val().length) {
    showReportDocAlert("warning", "Please input Report title");
    return;
  }
  var selectDocIds = [];
  $.each($checkedInputs, function (i, v) {
    selectDocIds.push($checkedInputs.eq(i).data("doc-id"));
  });
  var selectedReportType = $("select.report-doc-report-type").val();
  var requestData = {
    type: selectedReportType,
    ids: selectDocIds.join(","),
    title: $(".report-doc-report-title").val(),
    client: localStorage.getItem("client_id"),
  };

  $(".report-load-icon").css("display", "");
  $.ajax({
    url: `https://toddles-api.phantominteractive.com.au/report`,
    type: "POST",
    data: JSON.stringify(requestData),
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.error == undefined) {
        // goReportResultPage(response, response.title);
        $("#msg_drafts_success").html("Success! Your report has been created");
        $("#alert_drafts_success")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        $("#alert_drafts_success .alert")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        goBackToDrafts();
        close_alert_after_5();
      } else {
        showReportDocAlert(
          "error",
          "Error! " + response.error ? response.error : "An error occured."
        );
        console.log(response.error);
      }
      $(".report-load-icon").fadeOut();
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function getTemplates() {
  $.ajax({
    url: `https://toddles-api.phantominteractive.com.au/templates`,
    type: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.success) {
        $.each(response.templates, function (i, v) {
          REPORT_TYPES[v.id] = v.title;
        });
        // Prepare report type dropdown
        var reportTypeEl = $(".report-doc-report-type");
        $.each(REPORT_TYPES, function (key, value) {
          reportTypeEl.append(`
						<option value="${key}">${value}</option>
					`);
        });
      } else {
        console.error(response);
      }
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

$(".report-doc-report-type").change(function () {
  $(".report-doc-report-title").val($(this).find("option:selected").text());
});

function setIsReportEdited() {
  isReportEdited = true;
}

$("#myTextarea").on("input", function () {
  isReportEdited = true;
  textareaAutoResize($(".report-result-content")[0], false, true);
});

function confirmDeleteReport(reportId) {
  $("#delete_report_id").val(reportId);
  $("#confirmDeleteModal").modal("show");
}

function deleteReport() {
  $(".report-load-icon").css("display", "");
  var reportId = $("#delete_report_id").val();
  $.ajax({
    url: `https://toddles-api.phantominteractive.com.au/delete`,
    type: "POST",
    data: JSON.stringify({
      id: reportId,
      client: localStorage.getItem("client_id"),
    }),
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.error == undefined) {
        $("#msg_drafts_success").html("Success! The report has been deleted");
        $("#alert_drafts_success")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        $("#alert_drafts_success .alert")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        getDrafts();
      } else {
        $("#msg_drafts_error").html(
          "Error! " + response.error ? response.error : "An error occured."
        );
        $("#alert_drafts_error")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        $("#alert_drafts_error .alert")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        console.log(response.error);
      }
      $(".report-load-icon").fadeOut();
      close_alert_after_5();
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function setPageHeader(reset, title, subtitle) {
  if (reset) {
    $("#page_title").html("Report");
    $("#page_subtitle").html("You can generate reports");
    $(".report-detail-heading").css("display", "none");
    $(".report-list-heading").fadeIn("slow");
  } else {
    $("#page_title").html(title);
    $("#page_subtitle").html(subtitle);
    $(".report-list-heading").css("display", "none");
    $(".report-detail-heading").fadeIn("slow");
  }
}

function blockDragStart() {
  var $fT = $("#myTextarea");

  makeDrag($(".block-list li"));

  $(".custom-block").draggable({
    revert: function (validDrop) {
      if (!validDrop || clickEvenKey) {
        makeText($fT, true);
      }
      return !validDrop || clickEvenKey;
    },
    helper: "clone",
    cursor: "pointer",
    start: function (e, ui) {
      $("#myTextarea").html(
        $("#myTextarea")
          .html()
          .replace(/<div>/g, "<br>")
          .replace(/<\/div>/g, "")
      );
      makeDrop($fT, true);
      $(".custom_block").remove();
      if (!$(ui.helper).hasClass("flash-cursor")) {
        document.addEventListener("keyup", triggerMouseUpOnESC);
      }
      $(ui.helper).addClass("block-dragging");
    },
    stop: function (event, ui) {
      $(ui.helper).removeClass("block-dragging");
      document.removeEventListener("keyup", triggerMouseUpOnESC);
    },
  });

  $("#blockListButton").show();
}

function makeDrag($item) {
  $item.draggable({
    revert: function (validDrop) {
      if (!validDrop || clickEvenKey) {
        makeText($("#myTextarea"), true);
      }
      return !validDrop || clickEvenKey;
    },
    helper: "clone",
    cursor: "pointer",
    start: function (e, ui) {
      $("#myTextarea").html(
        $("#myTextarea")
          .html()
          .replace(/<div>/g, "<br>")
          .replace(/<\/div>/g, "")
      );
      makeDrop($("#myTextarea"));
      $(".custom_block").remove();
      $(ui.helper).addClass("block-dragging");
      if (!$(ui.helper).hasClass("flash-cursor")) {
        document.addEventListener("keyup", triggerMouseUpOnESC);
      }
    },
    stop: function (event, ui) {
      $(ui.helper).removeClass("block-dragging");
      document.removeEventListener("keyup", triggerMouseUpOnESC);
      clickEvenKey = false;
    },
  });
}

const triggerMouseUpOnESC = (evt) => {
  if (evt.key === "Escape") {
    const clickEvent = document.createEvent("MouseEvents");
    clickEvent.initEvent("mouseup", true, true);
    document.dispatchEvent(clickEvent);
    clickEvenKey = true;
  }
};

function makeDrop($item, custom = false) {
  if ($item.hasClass("noEdit")) {
    return false;
  }
  $item.addClass("noEdit").attr("contenteditable", false);
  var words = $item.html().split("<br>");
  $item.html("");
  var i = 0;
  if (words.length > 1 && words[words.length - 1] === "") {
    words.pop();
  }
  $.each(words, function (k, v) {
    var w = $("<span>", {
      class: "word word-" + k,
    }).html(v + "<br>");
    w.appendTo($item);
    i++;
  });
  $item.find(".word").droppable({
    drop: function (e, ui) {
      isReportEdited = true;
      setTimeout(() => {
        if (!clickEvenKey) {
          $("#blocksList").hide();
          $("#blockListButton img").show();
          if (custom) {
            $(e.target).removeClass("flash-cursor");
            newWord =
              '<span contenteditable="false" class="custom_block"><textarea placeholder="Prompt Olyv to extract any information you require, for example: Summarise relevant information of the treatment for the client in 30 words" rows="3" id="custom_block_name" ></textarea><button class="btn btn-info" onclick="getCustomPrompt()" id="get_prompt"><img style="display: none;" class=\'docs-detail-list-img\' src=\'./images/spinner.svg\'>Go!</button></span>';
            $(e.target).before(
              $("<span>", {
                class: "new word",
              }).html(newWord)
            );
            makeText($("#myTextarea"), true);
            $("#blockListButton img").hide();
            textareaAutoResize($(".report-result-content")[0], false, true);
          } else {
            getPrompt(
              ui.draggable.attr("data"),
              ui.draggable.attr("data-report-id")
            )
              .then(function (droppedHtml) {
                $(e.target).removeClass("flash-cursor");
                var i = 0;
                var newWord = "";
                function typeWriter() {
                  if (i < droppedHtml.length) {
                    newWord += droppedHtml.charAt(i);
                    if (i === 0) {
                      $(e.target).before(
                        $("<span>", {
                          class: "new word",
                        }).html(newWord)
                      );
                      // $(e.target).before($("<br>"));
                      textareaAutoResize(
                        $(".report-result-content")[0],
                        false,
                        true
                      );
                    } else {
                      $("#myTextarea span.new.word").html(newWord);
                      textareaAutoResize(
                        $(".report-result-content")[0],
                        false,
                        true
                      );
                    }
                    i++;
                    setTimeout(typeWriter, speed);
                  } else {
                    makeText($("#myTextarea"), true, true);
                    $("#blockListButton img").hide();
                  }
                }
                typeWriter();
              })
              .catch(function (error) {
                console.error(error);
                makeText($("#myTextarea"), true, true);
              });
          }
        } else {
          makeText($("#myTextarea"), true, true);
          clickEvenKey = false;
        }
      }, 10);
    },
    over: function (event, ui) {
      $(this).addClass("flash-cursor");
      $(document).on("keydown.escape", function (e) {
        if (e.key === "Escape") {
          ui.helper.animate(
            { position: "unset" },
            {
              duration: 0,
              complete: function () {
                console.log("Animation complete");
              },
            }
          );
          clickEvenKey = true;
          $(document).off("keydown.escape");
        }
      });
      textareaAutoResize($(".report-result-content")[0], false, true);
    },
    out: function (event, ui) {
      $(this).removeClass("flash-cursor");
      textareaAutoResize($(".report-result-content")[0], false, true);
    },
  });
}

function makeText($item, isDropped = false, addBr = false) {
  var words = "";
  $item.find("span.word").each(function (i) {
    words += $(this).html();
    if (
      addBr &&
      $(this).hasClass("new") &&
      i !== $item.find("span.word").length - 1
    ) {
      words += "<br><br>";
    }
  });
  if (words !== "") {
    $item.html(words);
    textareaAutoResize($(".report-result-content")[0], false, true);
  }
  if (isDropped) {
    $item.removeClass("noEdit").attr("contenteditable", true);
  }
}

$(function () {
  $("#blockListButton").on("click", function () {
    if ($("#myTextarea").hasClass("noEdit")) {
      return false;
    }
    $("#blocksList").toggle();
  });
  $(document).on("click", function (e) {
    if (
      e.target !== $("#blockListButton")[0] &&
      e.target !== $("#blocksList")[0] &&
      !$.contains($("#blockListButton")[0], e.target) &&
      !$.contains($("#blocksList")[0], e.target)
    ) {
      $("#blocksList").hide();
    }
  });
  $("#search_block").on("keyup", function (e) {
    if (e.target.value) {
      var $ul_block = $("ul.block-list");
      $ul_block.html("");
      if (allBlocks && allBlocks.length) {
        allBlocks
          .filter((b) => b.indexOf(e.target.value.toLowerCase()) > -1)
          .map((block) => {
            $ul_block.append(`
                            <li data-report-id='${currentDraftId}' data='${block}' class='block-list-item btn'>
                                <span class="">${block}</span>
                            </li>
                        `);
          });
      }
    } else {
      var $ul_block = $("ul.block-list");
      $ul_block.html("");
      if (allBlocks && allBlocks.length) {
        allBlocks.map((block) => {
          $ul_block.append(`
                            <li data-report-id='${currentDraftId}' data='${block}' class='block-list-item btn'>
                                <span class="">${block}</span>
                            </li>
                        `);
        });
      }
    }
    makeDrag($(".block-list li"));
  });
  $("#search_block").on("click", function (e) {
    this.select();
  });
});

$("#guide").click(function () {
  createVideoModal("report");
  $("#guideModal").modal({
    backdrop: "static",
    keyboard: true,
  });
});
