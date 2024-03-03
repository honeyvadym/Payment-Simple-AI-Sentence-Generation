$(function () {
  initMsg();
  $(".se-pre-con").fadeOut(300);
  $("#formRegister").validate({
    rules: {
      username: "required",
      reg_number: "required",
      terms: "required",
      password: {
        required: true,
        minlength: 6,
      },
      password_confirm: {
        required: true,
        equalTo: "#password-input",
      },
    },
    messages: {
      name: "Please enter your registered work email",
      reg_number: "Please provide your AHPRA registration number",
      terms: "Please read and accept our terms and conditions",
      password: {
        required: "Please enter your password",
        minlength: "Password must be at least 6 characters long",
      },
      password_confirm: {
        required: "Please enter your password confirmation",
        equalTo: "Passwords do not match",
      },
    },
    submitHandler: function (form) {
      $(".se-pre-con").fadeIn(300);
      var data = {
        username: $("input[name=username]").val(),
        password: $("input[name=password]").val(),
        reg_num: $("input[name=reg_number]").val(),
      };
      data = JSON.stringify(data);

      $.ajax({
        url: "https://toddles-api.phantominteractive.com.au/register",
        type: "POST",
        data: data,
        success: function (response) {
          if (response.error == undefined) {
            var token = response.token;
            localStorage.setItem("token", token);
            localStorage.setItem("user_name", $("input[name=username]").val());
            fakeLogin();
          } else {
            $("#msg").html(response.error);
            $("#alert").removeClass("hidden").addClass("show");
            $(".se-pre-con").fadeOut("slow");
          }
        },
        error: function (jqXHR, exception) {
          if (jqXHR.status == 401) {
            $("#msg").html(jqXHR.responseJSON.error);
            $("#alert").removeClass("hidden").addClass("show");
            $(".se-pre-con").fadeOut("slow");
          } else {
            redirectAjaxError(jqXHR);
          }
        },
      });
    },
  });
});

function initMsg() {
  var result = localStorage.getItem("error");
  if (result != undefined) {
    $("#msg").html(result);
    $("#alert").removeClass("hidden").addClass("show");
    localStorage.removeItem("error");
  }
}

function fakeLogin() {
  var data = {
    username: $("input[name=username]").val(),
    password: $("input[name=password]").val(),
  };
  data = JSON.stringify(data);
  $.ajax({
    url: "https://toddles-api.phantominteractive.com.au/login",
    type: "POST",
    data: data,
    success: function (response) {
      if (response.error == undefined) {
        var token = response.token;
        localStorage.setItem("token", token);
        localStorage.setItem("user_name", $("input[name=username]").val());
        window.location.href = "./dashboard.html";
      } else {
        $(".se-pre-con").fadeOut("slow");
      }
    },
  });
}
