$(function(){
    getDashboardInfo();
});



function getDashboardInfo(isMsg = true){
    $(".select_file_element").removeClass("hidden");
    $("#uploadForm").addClass("hidden");
    var token = localStorage.getItem("token");
    if(token == undefined){
        window.location.href ="./login.html";
        return;
    }
    var user_name = localStorage.getItem("user_name");
    var Authorization = user_name + " "+token;
    $.ajax({
        url: 'https://api.toddles.cloud/dashboard',
        type: 'GET',
        headers: {
            "Authorization":Authorization
        },
        success: function(response) {
            if(response.error == undefined){
                $(".se-pre-con").fadeOut("slow");
                var failed_docs = response['failed_docs'];
                setUiVal(response, isMsg, failed_docs);
                
            }else{
                localStorage.clear();
                localStorage.setItem("error", "Try again, dashboard error");
                window.location.href="./login.html";
            }
        },
        error: function (jqXHR, exception) {
            redirectAjaxError(jqXHR);
        }
    });

}

function setUiVal(response, isMsg = true, failed_docs){
    var credits = response.credits;
    var docs = response.docs;
    var docsInProgress = response.in_progress;
    var verified = response.verified;
    credits = getNumberFormat(credits.toFixed(2));
    docs = getNumberFormat(docs.toFixed(2));
    $("#my_credit").text(credits);
    $("#num_docs").text(docs);
    $("#in_progress").text(docsInProgress);

    var is_trial = localStorage.getItem("is_trial");
    if(is_trial != undefined){
        $("#msg_success").html("submitted for processing");
        $("#alert_success").removeClass("hidden").addClass("show");
        localStorage.removeItem("is_trial");
    }


    // if(!verified && isMsg){
    //     $("#msg").html("Please verify your email");
    //     $("#alert").removeClass("hidden").addClass("show");
    // }

    if (failed_docs) {
        var message = `${failed_docs} previous upload${failed_docs > 1 ? "s have" : " has"} failed to process, please note we can only process building reports at the moment`;
        $("#msg_failed_docs").html(message);
        $("#alert_failed_docs").removeClass("hidden").addClass("show");
    }

}


const dropArea = document.querySelector(".drop_box"),
button = dropArea.querySelector("button"),
dragText = dropArea.querySelector("header"),
input = dropArea.querySelector("input");
let file;
var filename;

button.onclick = () => {
  input.click();
};

input.addEventListener("change", function (e) {
  var fileName = e.target.files[0].name;
  $(".select_file_element").addClass("hidden");
  $("#file_name").text(fileName);
  $("#uploadForm").removeClass("hidden");
});

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(event) {
    event.preventDefault();
    event.stopPropagation();
  }

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  let dt = e.dataTransfer
  let files = dt.files

  handleFiles(files)
} 

function handleFiles(files) {
    if(files.length > 0){
        global_file = files[0];
        var fileName = global_file.name;
        $(".select_file_element").addClass("hidden");
        $("#file_name").text(fileName);
        $("#uploadForm").removeClass("hidden");
    }
}

var global_file = undefined;
function fileUpload(){
    var file ;
    $(".se-pre-con").fadeIn("slow");
    var file;
    if(global_file != undefined){
        file = global_file;
    }else{
        file = input.files[0];
    }
    var fileExtension = file.name.split('.').pop().toLowerCase();
    if (!fileExtension.includes("pdf")) {
        $("#msg").html("Invalid file type");
        $("#alert").removeClass("hidden").addClass("show");
        $(".se-pre-con").fadeOut("slow");
        resetUploadUI();
        return;
    }

    var formData = new FormData();
    formData.append("file", file);
    var Authorization = getAuthorizationHeader();
    $.ajax({
        url: 'https://api.toddles.cloud/upload',
        type: 'GET',
        headers: {
            "Authorization":Authorization
        },
        success: function(response) {
            if(response.url != undefined){
                $.ajax({
                    url: response.url,
                    type: 'PUT',
                    data: file,
                    processData: false,
                    success: function(response) {
                        getDashboardInfo(false);
                        $("#alert_success").removeClass("hidden").addClass("show");
                    },
                    error: function (jqXHR, exception) {
                        redirectAjaxError(jqXHR);
                    }
                });
                
                
            }else{
                localStorage.clear();
                localStorage.setItem("error", "Try again, upload error");
                window.location.href="./login.html";
            }
        },
        error: function (jqXHR, exception) {
            redirectAjaxError(jqXHR);
        }
    });
}