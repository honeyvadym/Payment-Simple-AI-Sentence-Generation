$(function () {
  getClients();
  getNotes();
  setAvatar();
});

var DOC_STATUS_TYPE = {
  INITIATED: "initiated",
  PROCESSING: "processing",
  AVAILABLE: "available",
  APPROVED: "approved",
  ERROR: "error",
};

var TIME_TO_REDIRECT_AFTER_APPROVE = 4 * 1000; // 4 seconds
window.jsPDF = window.jspdf.jsPDF;
var pdf_doc = new jsPDF("p", "mm", "a4");

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

function selectClient(clientName, clientId) {
  localStorage.setItem("client_name", clientName);
  localStorage.setItem("client_id", clientId);
  window.location.reload();
}

let isDocEdited = false;
var selectedDoc = null;
var allDocs = null;

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
        $("#table_notes").removeClass("hidden");
        var $tbody = $("#table_notes tbody");
        $("#table_notes tbody").html("");
        if (response.docs.length) {
          response.docs.map((doc) => {
            $tbody.append(`
							<tr>
								<td>${doc.title}</td>
								<td>${doc.date}</td>
								<td>
									
									${
                    doc.status == DOC_STATUS_TYPE.AVAILABLE
                      ? `<button class="btn btn-info btn-select" onclick="gotoDocDetail('${doc.id}', false);">
											<span class="fa fa-fw fa-folder mr-2"></span>Edit
										</button>`
                      : ``
                  }
									${
                    doc.status == DOC_STATUS_TYPE.APPROVED
                      ? `<button class="btn btn-info btn-select" onclick="gotoDocDetail('${doc.id}', false);">
											<span class="fa fa-fw fa-folder mr-2"></span>View
										</button>`
                      : ``
                  }
								</td>
								<td>
									${
                    doc.status == DOC_STATUS_TYPE.INITIATED
                      ? `<img class='spinner' src='./images/spinner.svg'>`
                      : ``
                  }
                  ${
                    doc.status == DOC_STATUS_TYPE.PROCESSING
                      ? `<img class='spinner' src='./images/spinner.svg'>`
                      : ``
                  }
									${
                    doc.status == DOC_STATUS_TYPE.APPROVED
                      ? `<i class='approved-doc-icon fa-solid fa-circle-check'></i>`
                      : ``
                  }
									${
                    doc.status == DOC_STATUS_TYPE.ERROR
                      ? `<i class='error-doc-icon fa-solid fa-circle-xmark'></i>`
                      : ``
                  }
								</td>
							</tr>
						`);
          });
        } else {
          $("#alert_list_info").removeClass("hidden").addClass("show").fadeIn();
          $("#alert_list_info .alert")
            .removeClass("hidden")
            .addClass("show")
            .fadeIn();
          $("#table_notes").addClass("hidden");
          close_alert_after_5();
        }
      } else {
        console.error(response);
      }
      $(".note-load-icon").fadeOut();
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}
function translateDOM(str) {
  return str.replace(/\n/g, "<br>");
}
function gotoDocDetail(id, inactive) {
  if (inactive) {
    return;
  }
  // resetDocState();
  $(".note-load-icon").css("display", "");
  isDocEdited = false;
  $(".docs-list-box").addClass("hidden");
  $(".note-tab-wrapper").removeClass("hidden");
  $("#btn_approve").data("doc-id", id);
  var isApprovedNote =
    allDocs.find((item) => item.id === id).status === DOC_STATUS_TYPE.APPROVED;
  $.ajax({
    url: `https://toddles-api.phantominteractive.com.au/document?id=${id}`,
    type: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.success) {
        selectedDoc = response.document;

        Object.keys(selectedDoc.flag).map((key) => {
          $(".docs-detail-flag").append(`
						<div class="d-flex gap-4 flag-item">
							<label class="switch">
								<input type="checkbox" disabled  ${
                  response.document.flag[key] ? "checked" : ""
                }>
								<span class="slider"></span>
							</label>
							<span class="flag-item-key" data-key="${key}">${capitalize(key)}</span>
						</div>
					`);
        });

        $(".docs-detail-present").html("");
        Object.keys(response.document.presentation).map((key) => {
          $(".docs-detail-present").append(`
						<div class="d-flex gap-4 align-center present-item">
							<input id="presentation-${key}" type="checkbox" disabled ${
            response.document.presentation[key] ? "checked" : ""
          }>
							<label for="presentation-${key}" data-key="${key}">${capitalize(key)}</label>
						</div>
					`);
        });

        $(".note-result-transcript").html(
          translateDOM(response.document.transcript)
        );

        // $(".docs-detail-issue").val(response.document.box.issues);
        // textareaAutoResize($(".docs-detail-issue")[0]);
        $(".note-result-content").html(translateDOM(response.document.notes));
        // textareaAutoResize($(".docs-detail-presentation")[0], false);
        textareaAutoResize($(".note-result-content")[0], false, true);

        $(".docs-detail-date").html(response.document.date);
        $(".docs-detail-title").html(response.document.title);
        $(".docs-detail-description").val(response.document.observations);
        setPageHeader(false, response.document.title, response.document.date);
        // localStorage.setItem('note_time', response.document.timestamp);
        if (isApprovedNote) {
          $("#myTextarea").removeClass("noEdit").attr("contenteditable", false);
          $("#btn_approve").addClass("hidden");
          $("#btn_save").addClass("disabled");
        } else {
          $("#myTextarea").removeClass("noEdit").attr("contenteditable", true);
          $("#btn_approve").addClass("disabled");
          $("#btn_save").addClass("disabled");
        }
      } else {
        selectedDoc = null;
        console.error(response);
      }
      $(".note-load-icon").fadeOut();
    },
    error: function (jqXHR, exception) {
      selectedDoc = null;
      redirectAjaxError(jqXHR);
    },
  });
}

function goBackToDocList() {
  if (isDocEdited) {
    isDocEdited = false;
    $("#confirmModal").modal({
      backdrop: "static",
    });
    return;
  }
  isDocEdited = false;
  showDocList();
}
$("#myTextarea").on("input", function () {
  setIsDocEdited();
  textareaAutoResize($(".note-edit-content")[0]);
});
function resetDocState() {
  $("#btn_save").addClass("disabled");
  $("#myTextarea").removeClass("noEdit").attr("contenteditable", false);
  $("#btn_approve").removeClass("disabled");
}

function showDocList() {
  getNotes();
  $(".docs-list-box").removeClass("hidden");
  $(".note-tab-wrapper").addClass("hidden");
  $(".docs-detail-issue").val("");
  $(".note-result-content").html("");
  $(".docs-detail-date").text("");
  $(".docs-detail-title").text("");
  setPageHeader(true);
  $("#alert_doc_success").removeClass("show").addClass("hidden");
  $("#alert_doc_success .alert").removeClass("show").addClass("hidden");
  $("#alert_doc_error").removeClass("show").addClass("hidden");
  $("#alert_doc_error .alert").removeClass("show").addClass("hidden");
  $(".docs-detail-box .alert-backdrop").removeClass("show").addClass("hidden");
  $(".docs-detail-box .alert").removeClass("show").addClass("hidden");
  selectedDoc = null;
}

$(".btn-confirm").click(function () {
  showDocList();
});

function translateDOM(str) {
  return str.replace(/\n/g, "<br>");
}

function capitalize(str) {
  var words = str.split("_");
  var capitalizedWords = words.map((word) => {
    var firstLetter = word.charAt(0).toUpperCase();
    var restOfWord = word.slice(1);
    return firstLetter + restOfWord;
  });
  return capitalizedWords.join(" ");
}

function setIsDocEdited() {
  isDocEdited = true;
  localStorage.setItem("isDocEdited", "true");
  $("#btn_approve").addClass("disabled");
  $("#btn_save").removeClass("disabled");
}

function saveDoc() {
  $(".note-load-icon").css("display", "");
  const doc_notes = $(".note-result-content").html();

  const data = {
    ...selectedDoc,
    notes: doc_notes,
  };

  $.ajax({
    url: "https://toddles-api.phantominteractive.com.au/notes_save",
    type: "POST",
    data: JSON.stringify(data),
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.success && response.error === undefined) {
        isDocEdited = false;
        $("#alert_doc_success").removeClass("hidden").addClass("show").fadeIn();
        $("#alert_doc_success .alert")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        $("#btn_approve").removeClass("disabled");
        $("#btn_save").addClass("disabled");
        // $("#myTextarea").removeClass("noEdit").attr("contenteditable", false);
      } else {
        const errorAlert = $("#alert_doc_error");
        errorAlert
          .find("span")
          .eq(0)
          .text(
            "Error! " + response.error ? response.error : "An error occured."
          );
        errorAlert.removeClass("hidden").addClass("show").fadeIn();
        console.log(response.error);
      }
      $(".note-load-icon").fadeOut();
      close_alert_after_5();
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}
function confirmApprove() {
  $("#confirmApproveModal").modal({
    backdrop: "static",
  });
}
function approveDoc() {
  $(".note-load-icon").css("display", "");
  const doc_notes = $(".note-result-content").html();

  const data = {
    ...selectedDoc,
    notes: doc_notes,
  };

  $.ajax({
    url: "https://toddles-api.phantominteractive.com.au/notes_approve",
    type: "POST",
    data: JSON.stringify(data),
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.error === undefined) {
        isDocEdited = false;
        $("#alert_doc_approved")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        $("#alert_doc_approved .alert")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        getNotes();
        startTimerToNavigate();
      } else {
        const errorAlert = $("#alert_doc_error");
        errorAlert
          .find("span")
          .eq(0)
          .text(
            "Error! " + response.error ? response.error : "An error occured."
          );
        errorAlert.removeClass("hidden").addClass("show").fadeIn();
        console.log(response.error);
      }
      $(".note-load-icon").fadeOut();
      close_alert_after_5();
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function startTimerToNavigate() {
  setTimeout(function () {
    if (!$(".note-tab-wrapper").hasClass("hidden")) {
      goBackToDocList();
    }
  }, TIME_TO_REDIRECT_AFTER_APPROVE);
}

function setPageHeader(reset, title, subtitle) {
  if (reset) {
    $("#page_title").html("Notes");
    $("#page_subtitle").html("You can review your notes and edit them");
    $(".note-detail-title").css("display", "none");
    $(".note-list-title").fadeIn("slow");
  } else {
    $("#page_title").html(title);
    $("#page_subtitle").html(subtitle);
    $(".note-list-title").css("display", "none");
    $(".note-detail-title").fadeIn("slow");
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
  var $el = $(".note-result-content").clone(true, false);
  // $el.find(".non-export").remove();
  $el.removeClass("shadow-box");
  $el.css("border", "none");
  // var content = "<div>" + $(".report-result-content").html() + "</div>";
  // var timeStamp = new Date(Number(localStorage.getItem('note_time')) * 1000);
  // var date = timeStamp.getFullYear() + "-" + (timeStamp.getMonth() + 1) + "-" + timeStamp.getDate();
  var date = $("#page_subtitle").text();
  var clientName = localStorage.getItem("client_name")
    ? localStorage.getItem("client_name").replace(" ", "-")
    : "no-name";
  if (type == "doc") {
    var preHtml =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
    var postHtml = "</body></html>";
    var html = preHtml + "<div>" + $(".note-result-content").html() + "</div>";
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
      : "session-note-" + clientName + "-" + date + ".doc";

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
    const element = document.querySelector(".note-result-content");
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
      : "session-note-" + clientName + "-" + date + ".pdf";
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

$("#guide").click(function () {
  createVideoModal("notes");
  $("#guideModal").modal({
    backdrop: "static",
    keyboard: true,
  });
});
