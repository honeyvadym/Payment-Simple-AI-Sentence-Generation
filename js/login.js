$(function () {
  initMsg();
  $(".se-pre-con").fadeOut(300);
  initMsg();
  $("#formLogin").validate({
    submitHandler: function (form) {
      $(".se-pre-con").fadeIn(300);
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
          if (response?.success) {
            var token = response.token;
            localStorage.setItem("token", token);
            localStorage.setItem("user_name", $("input[name=username]").val());
            window.location.href = "./dashboard.html";
          } else {
            $("#mfa_num").prop("disabled", false);
            $("#mfa_spin").hide();
            $("#mfa_num").val("");
            $(".se-pre-con").fadeOut("slow");
            $("#mfa_modal").modal("show");
            setTimeout(() => {
              $("#mfa_num").focus();
            }, 1000);
            $("#mfa_num").on("input", function () {
              if ($("#mfa_num").val().length == 6) {
                $("#mfa_num").prop("disabled", true);
                $("#mfa_spin").show();
                mfaLogin();
              }
            });
          }
        },
        error: function (jqXHR, exception) {
          if (jqXHR?.status == 401) {
            $("#password-input").val("");
          }
          if (jqXHR["responseJSON"] && jqXHR["responseJSON"]["error"]) {
            $("#msg").html(jqXHR["responseJSON"]["error"]);
            $("#alert").removeClass("hidden").addClass("show");
          } else {
            $("#msg").html("Login failed!");
            $("#alert").removeClass("hidden").addClass("show");
          }
          $(".se-pre-con").fadeOut("slow");
        },
      });
    },
  });
});

function mfaLogin() {
  var data = {
    username: $("input[name=username]").val(),
    password: $("input[name=password]").val(),
    mfa_code: $("#mfa_num").val(),
  };
  data = JSON.stringify(data);

  $.ajax({
    url: "https://toddles-api.phantominteractive.com.au/login",
    type: "POST",
    data: data,
    success: function (response) {
      if (response?.success) {
        var token = response.token;
        localStorage.setItem("token", token);
        localStorage.setItem("user_name", $("input[name=username]").val());
        window.location.href = "./dashboard.html";
      } else {
        $("#mfa_modal").modal("hide");
        $(".se-pre-con").fadeOut("slow");
      }
    },
    error: function (jqXHR, exception) {
      $("#mfa_modal").modal("hide");
      if (jqXHR?.status == 401) {
        $("#password-input").val("");
      }
      if (jqXHR["responseJSON"] && jqXHR["responseJSON"]["error"]) {
        $("#msg").html(jqXHR["responseJSON"]["error"]);
        $("#alert").removeClass("hidden").addClass("show");
      } else {
        $("#msg").html("Login failed!");
        $("#alert").removeClass("hidden").addClass("show");
      }
      $(".se-pre-con").fadeOut("slow");
    },
  });
}

function initMsg() {
  var result = localStorage.getItem("error");
  if (result != undefined) {
    $("#msg").html(result);
    $("#alert").removeClass("hidden").addClass("show");
    localStorage.removeItem("error");
  }
}
