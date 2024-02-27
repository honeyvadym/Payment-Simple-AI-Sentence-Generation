var REPORT_TYPES = {
  gp: "GP Letter",
};
window.jsPDF = window.jspdf.jsPDF;
var pdf_doc = new jsPDF();

$(function () {
  ret = localStorage.getItem("client_name");
  // var name = "";
  // if(ret != undefined){
  //     name = ret;
  //     localStorage.removeItem("client_name");
  // }
  var result_html = "Client Name: " + (ret ?? "");
  $("#result").html(result_html);
  init();
  $(".se-pre-con").fadeOut(300);

  // Check browser support for recording
  if (!navigator.mediaDevices) {
    $("#alert_mediadevice").removeClass("hidden").addClass("show");
    recordButton.disabled = true;
    return;
  }
  // Check permission for recording
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      console.log("MediaDevices: Permission is allowed");
    })
    .catch(function (err) {
      if ((err + "").includes("Permission denied")) {
        $("#msg_mediadevice").text(
          "You didn't allow the micronphone permission yet. Please allow it manually."
        );
        $("#alert_mediadevice").removeClass("hidden").addClass("show");
        recordButton.disabled = true;
      } else {
        console.error(`MediaDevices: ${err}`);
      }
      return;
    });
});

//webkitURL is deprecated but neverthelessapi.olyvhealth.com
URL = window.URL || window.webkitURL;

var gumStream; //stream from getUserMedia()
var recorder; //WebAudioRecorder object
var input; //MediaStreamAudioSourceNode  we'll be recording
// var encodingType; 					//holds selected encoding for resulting audio (file)
var encodeAfterRecord = true; // when to encode
var recordTimer;
var recordedBlob;

// shim for AudioContext when it's not avb.
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //new audio context to help us record

// var encodingTypeSelect = document.getElementById("encodingTypeSelect");
// var recordingsList = document.getElementById("recordingsList");
var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var resetButton = document.getElementById("resetButton");
var uploadButton = document.getElementById("uploadButton");
var $recordingTime = $("#recordingTime");
var $recordingTimeText = $("#recordingTimeText");

recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
resetButton.addEventListener("click", resetRecording);
uploadButton.addEventListener("click", uploadRecording);

var constraints = { audio: true, video: false };

function init() {
  recordButton.style.display = "flex";
  stopButton.style.display = "none";
  resetButton.style.display = "none";
  uploadButton.style.display = "none";

  getNotes();
  getReportDrafts();
  getTemplates();
}

function startRecording() {
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      audioContext = new AudioContext();
      gumStream = stream;
      input = audioContext.createMediaStreamSource(stream);
      encodingType = "wav";
      recorder = new WebAudioRecorder(input, {
        workerDir: "js/", // must end with slash
        encoding: encodingType,
        numChannels: 1, // mono channel
      });

      recorder.onComplete = function (recorder, blob) {
        recordedBlob = blob;
        createDownloadLink(blob, recorder.encoding);
      };

      recorder.setOptions({
        timeLimit: 120 * 60, // 120 minutes
        encodeAfterRecord: encodeAfterRecord,
        ogg: { quality: 0.5 },
        mp3: { bitRate: 96 },
      });

      recorder.startRecording();
      setTimer();
    })
    .catch(function (err) {
      console.error(`MediaDevices: ${err}`);
      // recordButton.disabled = false;
      // stopButton.disabled = true;
      // resetButton.disabled = true;
      // uploadButton.disabled = true;
      recordButton.style.display = "flex";
      stopButton.style.display = "none";
      resetButton.style.display = "none";
      uploadButton.style.display = "none";
    });
  // recordButton.disabled = true;
  // stopButton.disabled = false;
  // resetButton.disabled = true;
  // uploadButton.disabled = true;
  recordButton.style.display = "none";
  stopButton.style.display = "flex";
  resetButton.style.display = "none";
  uploadButton.style.display = "none";
}

function stopRecording() {
  gumStream.getAudioTracks()[0].stop();
  stopTimer();
  // stopButton.disabled = true;
  // recordButton.disabled = true;
  // resetButton.disabled = false;
  // uploadButton.disabled = false;
  recordButton.style.display = "none";
  stopButton.style.display = "none";
  resetButton.style.display = "flex";
  uploadButton.style.display = "flex";
  recorder.finishRecording();
}

function resetRecording() {
  if (window.confirm("Are you sure you want to start over?")) {
    // recordingsList.innerHTML = "";
    // recordButton.disabled = false;
    // stopButton.disabled = true;
    // resetButton.disabled = true;
    // uploadButton.disabled = true;
    recordButton.style.display = "flex";
    stopButton.style.display = "none";
    resetButton.style.display = "none";
    uploadButton.style.display = "none";
    removeTimer();

    // startRecording();
  }
}

function uploadRecording() {
  $(".se-pre-con").fadeIn("slow");

  var token = localStorage.getItem("token");
  var user_name = localStorage.getItem("user_name");
  if (user_name == undefined) {
    localStorage.clear();
    localStorage.setItem("error", "Try again");
    window.location.href = "./login.html";
    return;
  }
  var Authorization = user_name + " " + token;

  var recordingType = $("#recording_type").val();
  $.ajax({
    url: `https://api.olyvhealth.com/upload?type=${recordingType}`,
    type: "GET",
    headers: {
      Authorization: Authorization,
    },
    success: function (response) {
      if (response.url != undefined) {
        var file = new File([recordedBlob], Date.now() + ".mp3", {
          type: "audio/wav",
        });

        $.ajax({
          url: response.url,
          type: "PUT",
          data: file,
          processData: false,
          success: function (response) {
            $(".se-pre-con").fadeOut();
            $("#alert_recording").removeClass("hidden").addClass("show");

            // recordingsList.innerHTML = "";
            // recordButton.disabled = false;
            // stopButton.disabled = true;
            // resetButton.disabled = true;
            // uploadButton.disabled = true;
            recordButton.style.display = "flex";
            stopButton.style.display = "none";
            resetButton.style.display = "none";
            uploadButton.style.display = "none";
            removeTimer();
          },
          error: function (jqXHR, exception) {
            redirectAjaxError(jqXHR);
          },
        });
      } else {
        localStorage.clear();
        localStorage.setItem("error", "Try again");
        window.location.href = "./login.html";
      }
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function setTimer() {
  recordTimer = setInterval(function () {
    var timeInSecond = recorder.recordingTime();
    $recordingTime.removeClass("hidden");
    var minutes = Math.floor(timeInSecond / 60);
    var seconds = Math.floor(timeInSecond % 60);
    $recordingTimeText.html(
      (minutes < 10 ? `[0${minutes} : ` : `[${minutes} : `) +
        (seconds < 10 ? `0${seconds}]` : `${seconds}]`)
    );
  }, 1000);
}

function removeTimer() {
  $recordingTime.addClass("hidden");
  $recordingTimeText.html("[00 : 00]");
}

function stopTimer() {
  clearInterval(recordTimer);
}

function createDownloadLink(blob, encoding, filename = "") {
  // stopButton.disabled = true;
  // recordButton.disabled = true;
  // resetButton.disabled = false;
  // uploadButton.disabled = false;
  recordButton.style.display = "none";
  stopButton.style.display = "none";
  resetButton.style.display = "flex";
  uploadButton.style.display = "flex";

  // var url = URL.createObjectURL(blob);
  // var au = document.createElement('audio');
  // var li = document.createElement('li');
  // var link = document.createElement('a');
  // au.controls = true;
  // au.src = url;
  // link.href = url;
  // if (filename) {
  //     link.download = filename;
  // } else {
  //     link.download = new Date().toISOString() + '.'+encoding;
  // }
  // link.innerHTML = link.download;
  // li.appendChild(au);
  // li.appendChild(link);
  // recordingsList.innerHTML = "";
  // recordingsList.appendChild(li);
}

var isDocEdited = false;
var selectedDoc = null;
var allDocs = null;

function getNotes() {
  $.ajax({
    url: `https://api.olyvhealth.com/docs`,
    type: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.success) {
        allDocs = response.docs;
        var $ul = $("#docs_list");
        response.docs.map((doc) => {
          $ul.append(`
						<li class='${doc.status == "processing" ? "inactive" : ""}' 
						onclick="gotoDocDetail('${doc.id}', ${doc.status == "processing"});">
							${doc.title} 
							${
                doc.status == "processing"
                  ? "<img class='client-docs-detail-list-img' src='./images/spinner.svg'>"
                  : ""
              }
						</li>
					`);
        });
        $(".client-load-icon").fadeOut();
      } else {
        console.error(response);
      }
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function gotoDocDetail(id, inactive) {
  if (inactive) {
    return;
  }
  $(".client-load-icon").css("display", "");
  isDocEdited = false;
  $(".client-docs-list-box").addClass("hidden");
  $(".client-docs-detail-box").removeClass("hidden");
  $("#btn_approve").data("doc-id", id);
  $.ajax({
    url: `https://api.olyvhealth.com/document?id=${id}`,
    type: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.success) {
        selectedDoc = response.document;
        $(".client-docs-detail-issue").val(response.document.box.issues);
        $(".client-docs-detail-presentation").val(
          response.document.box.presentation
        );
        $(".docs-detail-date").html(response.document.date);
        $(".docs-detail-title").html(response.document.title);
        $(".client-docs-detail-description").val(response.document.note);
        Object.keys(response.document.flag).map((key) => {
          $(".client-docs-detail-flag").append(`
						<div class="d-flex gap-4 client-flag-item">
							<label class="switch">
								<input type="checkbox" ${
                  response.document.flag[key] ? "checked" : ""
                } onchange="setIsDocEdited()">
								<span class="slider"></span>
							</label>
							<span class="client-flag-item-key" data-key="${key}">${capitalize(key)}</span>
						</div>
					`);
        });
        $(".client-load-icon").fadeOut();
      } else {
        selectedDoc = null;
        console.error(response);
      }
    },
    error: function (jqXHR, exception) {
      selectedDoc = null;
      redirectAjaxError(jqXHR);
    },
  });
}

function goBackToDocList() {
  if (isDocEdited) {
    if (!window.confirm("Are you sure to discard changes?")) {
      return;
    }
  }

  $(".client-docs-list-box").removeClass("hidden");
  $(".client-docs-detail-box").addClass("hidden");
  $(".client-docs-detail-issue").val("");
  $(".client-docs-detail-presentation").val("");
  $(".docs-detail-date").text("");
  $(".docs-detail-title").text("");
  $(".client-docs-detail-flag").html("");
  $(".client-docs-detail-description").val("");
  $("#alert_doc_success").removeClass("show").addClass("hidden");
  $("#alert_doc_error").removeClass("show").addClass("hidden");
  isDocEdited = false;
  selectedDoc = null;
}

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
}

function approveDoc() {
  $(".client-load-icon").css("display", "");
  var doc_issue = $(".client-docs-detail-issue").val();
  var doc_presentation = $(".client-docs-detail-presentation").val();
  var doc_description = $(".client-docs-detail-description").val();
  var doc_flag = {};

  var $items = $(".client-docs-detail-flag").find(".client-flag-item");
  $.each($items, function (i, v) {
    var $item = $items.eq(i);
    var key = $item.find(".client-flag-item-key").data("key");
    var value = $item.find("input").prop("checked");
    doc_flag[key] = value;
  });

  var data = {
    ...selectedDoc,
    box: {
      issues: doc_issue,
      presentation: doc_presentation,
    },
    flag: doc_flag,
    note: doc_description,
  };

  $.ajax({
    url: "https://api.olyvhealth.com/approve",
    type: "POST",
    data: JSON.stringify(data),
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.error == undefined) {
        isDocEdited = false;
        $("#alert_doc_success").removeClass("hidden").addClass("show");
        $("#alert_doc_success .alert").removeClass("hidden").addClass("show");
      } else {
        $("#alert_doc_error").removeClass("hidden").addClass("show");
        $("#alert_doc_error .alert").removeClass("hidden").addClass("show");
        console.log(response.error);
      }
      $(".client-load-icon").fadeOut();
      var tabView = document.getElementById("ex1-content");
      tabView.scrollTop = tabView.scrollHeight;
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

/**
 * Report Section functions
 */

function getTemplates() {
  $.ajax({
    url: `https://api.olyvhealth.com/templates`,
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

function getReportDrafts() {
  $.ajax({
    url: `https://api.olyvhealth.com/drafts`,
    type: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.success) {
        var $ul = $(".report-drafts-list");
        response.drafts.map((draft) => {
          $ul.append(`
						<li class='report-drafts-item' 
						onclick="goReportResultPage(null, '${draft.title}', '${draft.id}')">
							<span>${draft.title}</span>
							<span>${draft.date}</span>
						</li>
					`);
        });
      } else {
        console.error(response);
      }
      $(".client-report-load-icon").fadeOut();
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function createNewReport() {
  $(".report-drafts-section").addClass("hidden");
  $(".report-docs-section").removeClass("hidden");
  $(".report-result-section").addClass("hidden");

  var $ul = $("ul.client-report-docs-list");
  $ul.html("");
  allDocs.map((doc) => {
    $ul.append(`
			<li class='client-report-docs-item ${
        doc.status == "processing" ? "inactive" : ""
      }'>
				<input 
				data-doc-id="${doc.id}"
				class="form-control" type="checkbox" 
				${doc.status == "processing" ? "disabled" : ""}>
				${doc.title} 
				${
          doc.status == "processing"
            ? "<img class='client-docs-detail-list-img' src='./images/spinner.svg'>"
            : ""
        }
			</li>
		`);
  });
}

$("ul.client-report-docs-list").on("click", "li:not(.inactive)", function (e) {
  var $input = $(this).find("input");
  if (e.target == $input) {
    return;
  }
  $input.prop("checked", !$input.prop("checked"));
});

function goBackToDrafts() {
  $(".report-drafts-section").removeClass("hidden");
  $(".report-docs-section").addClass("hidden");
  $(".report-result-section").addClass("hidden");
}

function sendCreateReportRequest() {
  var $checkedInputs = $(".client-report-docs-list").find("input:checked");
  if (!$checkedInputs.length) {
    showReportDocAlert("warning");
    return;
  }
  var selectDocIds = [];
  $.each($checkedInputs, function (i, v) {
    selectDocIds.push($checkedInputs.eq(i).data("doc-id"));
  });
  var selectedReportType = $("select.client-report-doc-report-type").val();
  var requestData = {
    type: selectedReportType,
    ids: selectDocIds.join(","),
  };

  $(".client-report-load-icon").css("display", "");
  $.ajax({
    url: "https://api.olyvhealth.com/report",
    type: "POST",
    data: JSON.stringify(requestData),
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.error == undefined) {
        goReportResultPage(response, response.title);
      } else {
        showReportDocAlert("error", response.error);
        console.log(response.error);
      }
      $(".client-report-load-icon").fadeOut();
      var tabView = document.getElementById("ex1-content");
      tabView.scrollTop = tabView.scrollHeight;
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function goReportResultPage(result, title, draftID) {
  $(".client-report-load-icon").css("display", "");

  if (draftID == undefined || draftID == null) {
    $(".report-result-title").html(title);
    $(".report-result-date").html(result.date);
    $(".client-report-result-type").html(REPORT_TYPES[result.type]);
    var $ul = $("ul.client-report-result-docs");
    $ul.html("");
    var selectedDocs = result.docs.split(",");
    selectedDocs.map((docID) => {
      var doc = allDocs.find((item) => item.id == docID);
      $ul.append(`
				<li class='client-report-result-doc-item'>
					${doc.title} 
				</li>
			`);
    });
    $(".client-report-result-content").val(result.content);
    $(".client-report-load-icon").fadeOut();
  } else {
    $.ajax({
      url: `https://api.olyvhealth.com/draft?id=${draftID}`,
      type: "GET",
      headers: {
        Authorization: getAuthHeader(),
      },
      success: function (response) {
        if (response.success) {
          $(".report-result-title").html(title);
          $(".report-result-date").html(response.draft.date);
          $(".client-report-result-type").html(
            REPORT_TYPES[response.draft.type]
          );
          var $ul = $("ul.client-report-result-docs");
          $ul.html("");
          var selectedDocs = response.draft.docs.split(",");
          selectedDocs.map((docID) => {
            var doc = allDocs.find((item) => item.id == docID);
            if (doc) {
              $ul.append(`
								<li class='client-report-result-doc-item'>
									${doc.title} 
								</li>
							`);
            }
          });
          $(".client-report-result-content").val(response.draft.content);
        } else {
          console.error(response);
        }
        $(".client-report-load-icon").fadeOut();
      },
      error: function (jqXHR, exception) {
        redirectAjaxError(jqXHR);
      },
    });
  }

  $(".report-drafts-section").addClass("hidden");
  $(".report-docs-section").addClass("hidden");
  $(".report-result-section").removeClass("hidden");
}

function showReportDocAlert(status, msg) {
  var $alertEl = $(".report-docs-section").find(`#alert_report_doc_${status}`);
  var $messageEl = $alertEl.find("span").eq(0);
  $alertEl.removeClass("hidden").addClass("show");
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

function exportHTML(type) {
  var $el = $(".client-report-result-content").clone(true, false);
  // $el.find(".non-export").remove();
  $el.removeClass("shadow-box");
  $el.css("border", "none");
  var content =
    "<div>" + translateDOM($(".client-report-result-content").val()) + "</div>";

  if (type == "doc") {
    var header =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
      "xmlns:w='urn:schemas-microsoft-com:office:word' " +
      "xmlns='http://www.w3.org/TR/REC-html40'>" +
      "<head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head><body>";
    var footer = "</body></html>";

    var sourceHTML = header + content + footer;

    var source =
      "data:application/vnd.ms-word;charset=utf-8," +
      encodeURIComponent(sourceHTML);
    var fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = Date.now() + ".doc";
    fileDownload.click();
    document.body.removeChild(fileDownload);
  }

  if (type == "pdf") {
    pdf_doc.html($el[0], {
      callback: function (doc) {
        doc.save(Date.now() + ".pdf");
      },
      x: 15,
      y: 15,
      width: 170, //target width in the PDF document
      windowWidth: 650, //window width in CSS pixels
    });
  }
  $el.remove();
}
