$(function () {
  $(".se-pre-con").fadeOut(300);
  setAvatar();
  $("#register-form").validate({
    submitHandler: function (form) {
      $(".se-pre-con").fadeIn(300);
      var data = {};
      data.first_name = $("input[name=first_name]").val();
      data.last_name = $("input[name=last_name]").val();
      // data.name = $("input[name=first_name]").val() + " " + $("input[name=last_name]").val();
      data.email = $("input[name=email]").val();
      data.cid = $("input[name=cid]").val();
      data.dob = $("input[name=dob]").val();
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
        url: "https://api.olyvhealth.com/add",
        type: "POST",
        data: data,
        headers: {
          Authorization: Authorization,
        },
        success: function (response) {
          if (response.error == undefined) {
            localStorage.setItem(
              "add_client_name",
              data.first_name + " " + data.last_name
            );
            window.location.href = "./dashboard.html";
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
    },
  });
});
