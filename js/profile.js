$(function () {
  // $(".se-pre-con").fadeOut("slow");
  getProfile();
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
        url: "https://api.olyvhealth.com/feedback",
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
//file upload about signature & letter

function getProfile() {
  $.ajax({
    url: "https://api.olyvhealth.com/profile",
    type: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.error == undefined) {
        if (response?.mfa) {
          $("#mfa_btn").text('MFA enabled')
          $("#mfa_btn").prop("disabled", true);

        } else {
          $("#mfa_btn").text('Set up MFA')
          $("#mfa_btn").click(function(){
            setupMFA()
          })
        }
        $("#registration").val(response.registration);
        $("#first_name").val(response.first_name);
        $("#last_name").val(response.last_name);
        $("#email").val(response.email);
        if (response.signature != undefined) {
         $('#img_input_signature').attr('src',"https://olyvhealth.com/p/"+response.signature)
      }
      if (response.letter_head != undefined) {
        $('#img_input_letter_head').attr('src',"https://olyvhealth.com/p/"+response.letter_head)
      }
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

$(document).ready(function(){
    var avatar;
    var editingEl;
    var image = document.getElementById('uploadedAvatar');
    var cropBtn = document.getElementById('crop');
  
    var $modal = $('#cropAvatarmodal');
    var cropper;
  
    $('[data-toggle="tooltip"]').tooltip();
  
    $("#input_signature, #input_letter_head").on('change', function (e) {
      var files = e.target.files;
      editingEl = $(this).attr("id")
      var done = function (url) {
        // input.value = '';
        // console.log(input.value)
        image.src = url;
        $modal.modal('show');
      };
      // var reader;
      // var file;
      // var url;
  
      if (files && files.length > 0) {
        let file = files[0];
       
          // done(URL.createObjectURL(file));
        // if (URL) {
        // } 
        
        // else if (FileReader) {
          reader = new FileReader();
          reader.onload = function (e) {
          //   const ima = new Image();
          //   ima.src = e.target.result;
          //   ima.onload = function() {
          //     const width = this.width;
          //     const height = this.height;
          //     console.log('Width: ' + width + 'px, Height: ' + height + 'px');
          // };

            done(reader.result);
          };
          reader.readAsDataURL(file);
        // }
      }
    });
    
    
    
  
    $modal.on('shown.bs.modal', function () {
      cropper = new Cropper(image, {
        // aspectRatio: 1,
        viewMode: 0,
      });
    }).on('hidden.bs.modal', function () {
      cropper.destroy();
      cropper = null;
    });
  
    cropBtn.addEventListener('click', function () {
      // var initialAvatarURL;
      var canvas;
  
      $modal.modal('hide');
  
      if (cropper) {
        canvas = cropper.getCroppedCanvas({
          // width: 1080,
          // height: 768,
        });
        canvas.toBlob(function(blob) {
          // Calculate the byte size of the blob
          var byteSize = blob.size;
          console.log('Canvas byte size: ' + byteSize + ' bytes');
        }, 'image/png');

        $("#img_" + editingEl).attr('src', canvas.toDataURL());
        $(".se-pre-con").fadeIn(300);
        uploadRecording(editingEl.slice(6),canvas)
      }
    });
    
})

function uploadRecording(type, canvas) {
  $.ajax({
    url: `https://api.olyvhealth.com/upload?type=${type}`,
    type: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.url !== undefined) {
        canvas.toBlob(function(blob) {
         let  file = new File([blob], Date.now() + ".png", {
            type: "image/png",
          });
        console.log("********",file)

          $.ajax({
            url: response.url,
            type: "PUT",
            data: file,
            processData: false,
            success: function (response) {
              $("input:file").val("");
              $(".se-pre-con").fadeOut();
  
              $('#alert_img_success div.alert').css('display','block')
              $("#alert_img_success").removeClass("hidden").addClass("show");
  
            },
            error: function (jqXHR, exception) {
              redirectAjaxError(jqXHR);
            },
          });
        }, 'image/png', 1)

        
      } else {
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

function setupMFA() {
  $(".se-pre-con").fadeIn(300);
  $.ajax({
    url: `https://api.olyvhealth.com/setup_mfa`,
    type: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      $(".se-pre-con").fadeOut();
      if (response?.success) {
        $('#img_input_qrcode').attr('src', response.qr)
        $("#mfa_num").val("");
        $("#mfa_modal").modal('show')
        $("#mfa_num").on('input', function() {
          $("#mfa_warning").fadeOut()
          if ($("#mfa_num").val().length == 6) {
            $(".se-pre-con").fadeIn(300);
            validateMFA()
          }
        })
      } else {
        $("#alert_server_error").removeClass("hidden").addClass("show").fadeIn();
        $("#alert_server_error .alert").removeClass("hidden").addClass("show").fadeIn();
      }
      
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function validateMFA() {
  var data = {}
  data.mfa_code = $("#mfa_num").val()
  data = JSON.stringify(data);
  $.ajax({
    url: `https://api.olyvhealth.com/validate_mfa`,
    type: "POST",
    data : data,
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      $(".se-pre-con").fadeOut();
      if (response.error == undefined) {
        $("#alert_success_mfa").removeClass("hidden").addClass("show");
        $("#mfa_btn").text('MFA enabled')
        $("#mfa_btn").off("click");
        $("#mfa_btn").prop("disabled", true);
        $("#mfa_modal").modal('hide')
      } else {
        $("#alert_mfa_error").removeClass('hidden').addClass('show');
        $("#mfa_btn").text('Set up MFA')
        $("#mfa_num").addClass('shake-animation');
        setTimeout(() => {
          $("#mfa_num").removeClass('shake-animation');
        }, 1000);
      }

    },
    error: function (jqXHR, exception) {
      if (jqXHR?.status === 400 && jqXHR['responseJSON'] && jqXHR['responseJSON']['error']) {
        $(".se-pre-con").fadeOut();
        $("#mfa_warning").fadeIn(300)
        $("#mfa_btn").text('Set up MFA')
        $("#mfa_num").addClass('shake-animation');
        setTimeout(() => {
          $("#mfa_num").removeClass('shake-animation');
        }, 1000);
      } else {
        redirectAjaxError(jqXHR);
      }
    },
  });
}
