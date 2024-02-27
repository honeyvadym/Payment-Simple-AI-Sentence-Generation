$(function () {
  $(".se-pre-con").fadeOut("slow");
  setAvatar();

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


$("#guide").click(function() {
    createVideoModal("feedback");
    $("#guideModal").modal({
        backdrop: 'static',
        keyboard: true
    });
})