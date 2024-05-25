$(function () {
  getProfile();
  getOptions();
  //setDefaultSettings();
  $("#feedback-form").validate({
    submitHandler: function (form) {
      $(".se-pre-con").fadeIn(300);
      var data = {};
      data.type = $("select[name=type]").val();
      data.text = $("textarea[name=text]").val();
      data = JSON.stringify(data);
      var token = localStorage.getItem("token");
      var user_name = localStorage.getItem("user_name");
      if (user_name == undefined) {
        localStorage.clear();
        localStorage.setItem("error", "Try again");
        window.location.href = "./login.html";
        return;
      }
      var Authorization = user_name + " " + token;
      $.ajax({
        url: "https://api.toddles.cloud/feedback",
        type: "POST",
        data: data,
        headers: {
          Authorization: Authorization,
        },
        success: function (response) {
          if (response.error == undefined) {
            $("#alert_success").removeClass("hidden").addClass("show");
            $("select[name=type]").val("");
            $("textarea[name=text]").val("");
          } else {
            $("#msg").html(response.error);
            $("#alert").removeClass("hidden").addClass("show");
            $("#alert .alert").removeClass("hidden").addClass("show");
          }
          $(".se-pre-con").fadeOut("slow");
        },
        error: function (jqXHR, exception) {
          redirectAjaxError(jqXHR);
        },
      });
    },
  });
});
function clickSelectBoxFunc(index, status) {
  const selectedOptions = $("#options-box select")
    .map(function () {
      return { name: $(this).attr("id"), value: $(this).val() };
    })
    .get();
  console.log(selectedOptions);

  if (selectedOptions) {
    $.ajax({
      url: "https://api.toddles.cloud/set_default",
      type: "POST",
      data: JSON.stringify({
        type: "option",
        name: selectedOptions[index].name,
        value: selectedOptions[index].value,
      }),
      headers: {
        Authorization: getAuthHeader(),
      },
      success: function (response) {
        alert("Successfully Changed settings!!!");
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
            msgTxt = "402 Error";
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
  }
}
function clickCheckBoxFunc(index, status) {
  const checkboxOptions = $("#check-boxes input")
    .map(function () {
      return $(this).val();
    })
    .get();
  if (checkboxOptions) {
    $.ajax({
      url: "https://api.toddles.cloud/set_default",
      type: "POST",
      data: JSON.stringify({
        type: "box",
        name: checkboxOptions[index],
        value: status == 1 ? "no" : "yes",
      }),
      headers: {
        Authorization: getAuthHeader(),
      },
      success: function (response) {
        console.log("process", response);
        alert("Successfully Changed settings!!!");
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
            msgTxt = "402 Error";
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
        let html = "",
          checkBoxHtml = "<div>";
        let { options, boxes } = response;
        console.log("options", options);
        for (let i = 0; i < options.length; i++) {
          const option = options[i];
          html += `<label htmlFor="${option.name}">${option.name}:</label>
          <select id="${option.name}" onchange="clickSelectBoxFunc(${i},'${option.default}')">`;
          for (let j = 0; j < option.options.length; j++) {
            const child = option.options[j];
            const isSelected = child === option?.default ? "selected" : "";
            html += `<option key="${j}" value="${child}" ${isSelected}>${child}</option>`;
          }
          html += "</select>";
        }

        for (let i = 0; i < boxes.length; i++) {
          const box = boxes[i];
          checkBoxHtml += `<input type="checkbox" class="check-box" id="check-box-name-${i}" name="vehicle${i}" value=${
            box.name
          } onclick="clickCheckBoxFunc(${i},${box.default == "yes" ? 1 : 0})" ${
            box.default == "yes" && "checked"
          }>${box.name}</input>`;
          if ((i + 1) % 3 == 0 && i != 0) {
            checkBoxHtml = checkBoxHtml + "</div><div>";
          }
        }
        checkBoxHtml = checkBoxHtml + "</div>";
        $("#options-box").html(html);
        $("#check-boxes").html(checkBoxHtml);
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
function getProfile() {
  $.ajax({
    url: "https://api.toddles.cloud/profile",
    type: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.error == undefined) {
        if (response?.mfa) {
          $("#mfa_btn").text("MFA enabled");
          $("#mfa_btn").prop("disabled", true);
        } else {
          $("#mfa_btn").text("Set up MFA");
          $("#mfa_btn").click(function () {
            setupMFA();
          });
        }
        $("#registration").val(response.registration);
        $("#first_name").val(response.first_name);
        $("#last_name").val(response.last_name);
        $("#email").val(response.email);
      } else {
        $("#msg").html(response.error);
        $("#alert").removeClass("hidden").addClass("show");
        $("#alert .alert").removeClass("hidden").addClass("show");
      }
      $(".se-pre-con").fadeOut("slow");
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

// Start upload preview image

$(document).ready(function () {
  var avatar;
  var editingEl;
  var image = document.getElementById("uploadedAvatar");
  var cropBtn = document.getElementById("crop");

  var $modal = $("#cropAvatarmodal");
  var cropper;

  $('[data-toggle="tooltip"]').tooltip();

  $("#input_signature, #input_letter_head").on("change", function (e) {
    var files = e.target.files;
    editingEl = $(this).attr("id");
    var done = function (url) {
      image.src = url;
      $modal.modal("show");
    };

    if (files && files.length > 0) {
      let file = files[0];

      reader = new FileReader();
      reader.onload = function (e) {
        done(reader.result);
      };
      reader.readAsDataURL(file);
      // }
    }
  });

  $modal
    .on("shown.bs.modal", function () {
      cropper = new Cropper(image, {
        // aspectRatio: 1,
        viewMode: 0,
      });
    })
    .on("hidden.bs.modal", function () {
      cropper.destroy();
      cropper = null;
    });

  cropBtn.addEventListener("click", function () {
    // var initialAvatarURL;
    var canvas;

    $modal.modal("hide");

    if (cropper) {
      canvas = cropper.getCroppedCanvas({
        // width: 1080,
        // height: 768,
      });
      canvas.toBlob(function (blob) {
        // Calculate the byte size of the blob
        var byteSize = blob.size;
        console.log("Canvas byte size: " + byteSize + " bytes");
      }, "image/png");

      $("#img_" + editingEl).attr("src", canvas.toDataURL());
      $(".se-pre-con").fadeIn(300);
      uploadRecording(editingEl.slice(6), canvas);
    }
  });
});

function setupMFA() {
  $(".se-pre-con").fadeIn(300);
  $.ajax({
    url: `https://api.toddles.cloud/setup_mfa`,
    type: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      $(".se-pre-con").fadeOut();
      if (response?.success) {
        $("#img_input_qrcode").attr("src", response.qr);
        $("#mfa_num").val("");
        $("#mfa_modal").modal("show");
        $("#mfa_num").on("input", function () {
          $("#mfa_warning").fadeOut();
          if ($("#mfa_num").val().length == 6) {
            $(".se-pre-con").fadeIn(300);
            validateMFA();
          }
        });
      } else {
        $("#alert_server_error")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        $("#alert_server_error .alert")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
      }
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function validateMFA() {
  var data = {};
  data.mfa_code = $("#mfa_num").val();
  data = JSON.stringify(data);
  $.ajax({
    url: `https://api.toddles.cloud/validate_mfa`,
    type: "POST",
    data: data,
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      $(".se-pre-con").fadeOut();
      if (response.error == undefined) {
        $("#alert_success_mfa").removeClass("hidden").addClass("show");
        $("#mfa_btn").text("MFA enabled");
        $("#mfa_btn").off("click");
        $("#mfa_btn").prop("disabled", true);
        $("#mfa_modal").modal("hide");
      } else {
        $("#alert_mfa_error").removeClass("hidden").addClass("show");
        $("#mfa_btn").text("Set up MFA");
        $("#mfa_num").addClass("shake-animation");
        setTimeout(() => {
          $("#mfa_num").removeClass("shake-animation");
        }, 1000);
      }
    },
    error: function (jqXHR, exception) {
      if (
        jqXHR?.status === 400 &&
        jqXHR["responseJSON"] &&
        jqXHR["responseJSON"]["error"]
      ) {
        $(".se-pre-con").fadeOut();
        $("#mfa_warning").fadeIn(300);
        $("#mfa_btn").text("Set up MFA");
        $("#mfa_num").addClass("shake-animation");
        setTimeout(() => {
          $("#mfa_num").removeClass("shake-animation");
        }, 1000);
      } else {
        redirectAjaxError(jqXHR);
      }
    },
  });
}

window.paypal
  .Buttons({
    createOrder: function (data, actions) {
      // Set up the transaction
      let currentPrice = handlePrice();
      let customVariable = handleCustomVariable();
      return actions.order.create({
        purchase_units: [
          {
            amount: {
              currency_code: "AUD",
              value: currentPrice,
            },
            custom_id: customVariable,
          },
        ],
      });
    },
    onApprove: function (data, actions) {
      // Capture the funds from the transaction
      return actions.order.capture().then(function (details) {
        //console.log('Custom ID:', details.purchase_units[0].custom_id);
        $("#alert_success_refill").removeClass("hidden").addClass("show");
      });
    },
    onError: function (err) {
      // Show an error message to your buyer
      console.error("An error occurred during the transaction", err);
    },
  })
  .render("#paypal-button-container"); // Display payment button on your web page

function handlePrice() {
  var selectElement = document.getElementById("priceSelected");
  var selectedValue = selectElement.value;
  //console.log('You selected: ', selectedValue);
  return selectedValue;
}
function hideConfirmation() {
  $("#alert_success_refill").removeClass("show").addClass("hidden");
}

function handleCustomVariable() {
  var selectElement = document.getElementById("email");
  var selectedValue = selectElement.value;
  //console.log('You custom variable: ', selectedValue);
  return "toddles|" + selectedValue;
}
