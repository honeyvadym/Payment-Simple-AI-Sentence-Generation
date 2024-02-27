$(function () {
  getClients();
  checkRecordPermission();
  createBlankNote();
  init();
  setAvatar();
});

function getClients() {
  if (localStorage.getItem("client_name") == null) {
    window.location.href = "./dashboard.html";
  }
  $.ajax({
    url: "https://api.olyvhealth.com/clients",
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

function checkRecordPermission() {
  // Check browser support for recording
  if (!navigator.mediaDevices) {
    $("#alert_mediadevice").removeClass("hidden").addClass("show");
    $("#alert_mediadevice .alert").removeClass("hidden").addClass("show");
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
      console.log(err);
      if ((err + "").includes("Permission denied")) {
        $("#msg_mediadevice").text(
          "You didn't allow the micronphone permission yet. Please allow it manually."
        );
        $("#alert_mediadevice").removeClass("hidden").addClass("show");
        $("#alert_mediadevice .alert").removeClass("hidden").addClass("show");
        recordButton.disabled = true;
      } else if ((err + "").includes("Requested device not found")) {
        $("#msg_mediadevice").text("No recording device found");
        $("#alert_mediadevice").removeClass("hidden").addClass("show");
        recordButton.disabled = true;
      } else {
        console.error(`MediaDevices: ${err}`);
        $("#msg_mediadevice").text(err);
        $("#alert_mediadevice").removeClass("hidden").addClass("show");
        $("#alert_mediadevice .alert").removeClass("hidden").addClass("show");
        recordButton.disabled = true;
      }
      return;
    });
}

//webkitURL is deprecated but neverthelessapi.olyvhealth.com
URL = window.URL || window.webkitURL;

var gumStream; //stream from getUserMedia()
var recorder; //WebAudioRecorder object
var input; //MediaStreamAudioSourceNode  we'll be recording
var encodeAfterRecord = true; // when to encode
var recordTimer;
var recordedBlob;

var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //new audio context to help us record
var analyser;
let bufferLength;
let dataArray;

var backButton = document.getElementById("backButton");
var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var resetButton = document.getElementById("resetButton");
var uploadButton = document.getElementById("uploadButton");
var $recordingTime = $("#recordingTime");
var $recordingTimeText = $("#recordingTimeText");
const notesData = $("#notesData");

recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
resetButton.addEventListener("click", onClickResetButton);
uploadButton.addEventListener("click", uploadRecording);

var constraints = { audio: true, video: false };

function init() {
  backButton.style.display = "flex";
  recordButton.style.display = "flex";
  stopButton.style.display = "none";
  resetButton.style.display = "none";
  uploadButton.style.display = "none";
}

function startRecording() {
  if (!$("#recording_type").val()) {
    $("#alert_recording_type_invalid").removeClass("hidden").addClass("show");
    $("#alert_recording_type_invalid .alert")
      .removeClass("hidden")
      .addClass("show");
    return;
  } else {
    $("#alert_recording_type_invalid").removeClass("show").addClass("hidden");
    $("#alert_recording_type_invalid .alert")
      .removeClass("show")
      .addClass("hidden");
  }
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      audioContext = new AudioContext();

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);

      gumStream = stream;
      input = audioContext.createMediaStreamSource(stream);
      input.connect(analyser);
      visualize();
      encodingType = "wav";
      recorder = new WebAudioRecorder(input, {
        workerDir: "js/", // must end with slash
        encoding: encodingType,
        numChannels: 1, // mono channel
      });

      recorder.onComplete = function (recorder, blob) {
        recordedBlob = blob;
        // console.log(blob);
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
      backButton.style.display = "flex";
      recordButton.style.display = "flex";
      stopButton.style.display = "none";
      resetButton.style.display = "none";
      uploadButton.style.display = "none";
    });
  backButton.style.display = "none";
  recordButton.style.display = "none";
  stopButton.style.display = "flex";
  resetButton.style.display = "none";
  uploadButton.style.display = "none";
}

function visualize() {
  let canvas = document.getElementById("waveformCanvas");
  let canvasCtx = canvas.getContext("2d");

  function draw() {
    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = "rgb(226, 226, 226)";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = "rgb(0, 0, 0)";

    canvasCtx.beginPath();

    let sliceWidth = (canvas.width * 3.0) / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      let v = dataArray[i] / 128.0;
      let y = (v * canvas.height) / 2;
      canvasCtx.strokeStyle = `rgb(${(v * 100 - 99) * 100},0,0)`;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y * 2 - 15);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
  }

  draw();
}
function stopRecording() {
  gumStream.getAudioTracks()[0].stop();
  stopTimer();
  backButton.style.display = "none";
  recordButton.style.display = "none";
  stopButton.style.display = "none";
  resetButton.style.display = "flex";
  uploadButton.style.display = "flex";
  recorder.finishRecording();
}

function onClickResetButton() {
  $("#confirmModal").modal({
    backdrop: "static",
  });
}

$(".btn-confirm").click(function () {
  backButton.style.display = "flex";
  recordButton.style.display = "flex";
  stopButton.style.display = "none";
  resetButton.style.display = "none";
  uploadButton.style.display = "none";
  removeTimer();
});

function resetRecording() {
  backButton.style.display = "flex";
  recordButton.style.display = "flex";
  stopButton.style.display = "none";
  resetButton.style.display = "none";
  uploadButton.style.display = "none";
  removeTimer();
}

function uploadRecording() {
  $(".se-pre-con").addClass("d-flex");
  $(".se-pre-con p").removeClass("hidden");
  $(".se-pre-con").fadeIn("slow");

  var recordingType = $("#recording_type").val();
  var clientId = localStorage.getItem("client_id");
  $.ajax({
    url: `https://api.olyvhealth.com/upload?type=${recordingType}&client=${clientId}`,
    type: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.url !== undefined) {
        const file = new File([recordedBlob], Date.now() + ".mp3", {
          type: "audio/wav",
        });

        const doc_observation = $(".docs-detail-description").val();
        const doc_flag = {};
        const doc_presentation = {};

        const risks = $(".docs-detail-flag").find(".flag-item");
        $.each(risks, function (i, v) {
          const $item = risks.eq(i);
          const key = $item.find(".flag-item-key").data("key");
          doc_flag[key] = $item.find("input").prop("checked");
        });

        const presentation = $(".docs-detail-present").find(".present-item");
        $.each(presentation, function (i, v) {
          const $item = presentation.eq(i);
          const key = $item.find("label").data("key");
          doc_presentation[key] = $item.find("input").prop("checked");
        });

        $.ajax({
          url: "https://api.olyvhealth.com/observations",
          type: "POST",
          data: JSON.stringify({
            client: clientId,
            id: response.session_id,
            flag: doc_flag,
            presentation: doc_presentation,
            observations: doc_observation,
          }),
          headers: {
            Authorization: getAuthHeader(),
          },
          success: function (response) {
            // $("#alert_recording").removeClass("hidden").addClass("show");
          },
          error: function (jqXHR, exception) {
            redirectAjaxError(jqXHR);
          },
        });

        $.ajax({
          url: response.url,
          type: "PUT",
          data: file,
          processData: false,
          success: function (response) {
            $(".se-pre-con").removeClass("d-flex");
            $(".se-pre-con").fadeOut();
            $(".se-pre-con p").addClass("hidden");
            $("#alert_recording").removeClass("hidden").addClass("show");
            $("#alert_recording .alert")
              .removeClass("hidden")
              .addClass("show")
              .fadeIn();
            close_alert_after_5();
            backButton.style.display = "flex";
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
        // localStorage.clear();
        // localStorage.setItem("error", "Try again");
        // window.location.href="./login.html";
      }
      resetNotes();
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function setTimer() {
  recordTimer = setInterval(function () {
    var timeInSecond = recorder.recordingTime();
    $("#notesData").removeClass("hidden");
    $("#canvas-record").removeClass("hidden");
    $recordingTime.removeClass("hidden");
    notesData.removeClass("hidden");
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
  $("#canvas-record").addClass("hidden");
  notesData.addClass("hidden");
  $recordingTimeText.html("[00 : 00]");
}

function stopTimer() {
  clearInterval(recordTimer);
}

function createDownloadLink(blob, encoding, filename = "") {
  backButton.style.display = "none";
  recordButton.style.display = "none";
  stopButton.style.display = "none";
  resetButton.style.display = "flex";
  uploadButton.style.display = "flex";
}

function createBlankNote() {
  $.ajax({
    url: "https://api.olyvhealth.com/notes_blank",
    type: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.success && response.error === undefined) {
        const blankDocument = response.document;

        Object.keys(blankDocument.flag).map((key) => {
          $(".docs-detail-flag").append(`
						<div class="d-flex gap-4 flag-item">
							<label class="switch">
								<input type="checkbox" ${response.document.flag[key] ? "checked" : ""}>
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
							<input id="presentation-${key}" type="checkbox" ${
            response.document.presentation[key] ? "checked" : ""
          }>
							<label for="presentation-${key}" data-key="${key}">${capitalize(key)}</label>
						</div>
					`);
        });
      }
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function capitalize(str) {
  const words = str.split("_");
  const capitalizedWords = words.map((word) => {
    const firstLetter = word.charAt(0).toUpperCase();
    const restOfWord = word.slice(1);
    return firstLetter + restOfWord;
  });
  return capitalizedWords.join(" ");
}

function resetNotes() {
  $(
    ".docs-detail-flag input[type='checkbox'], .docs-detail-present input[type='checkbox']"
  ).prop("checked", false);
  $(".docs-detail-description").val("");
}

$("#guide").click(function() {
    createVideoModal("session");
    $("#guideModal").modal({
        backdrop: 'static',
        keyboard: true
    });
})