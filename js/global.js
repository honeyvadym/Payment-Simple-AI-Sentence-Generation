$(document).ready(function() {
    $(".ease-in").addClass("animated-ease-in");
    $(".ease-out").addClass("animated-ease-out");
    $(".slide-in").addClass("animated-slide-in");
    setTimeout(() => {
        $(".scale").addClass("animated-scale");
    }, 700);

})


$(function(){
    var token = localStorage.getItem("token");
    if(token == undefined || token == ""){
        $(".register_btn").removeClass("hidden");
        $("#login_btn").removeClass("hidden");
        $("#clients_page_btn").addClass("hidden");
        $("#logout_btn").addClass("hidden");
        $("#logout_btn").addClass("hidden");
    }else{
        $(".register_btn").addClass("hidden");
        $("#login_btn").addClass("hidden");
        $("#clients_page_btn").removeClass("hidden");
        $("#logout_btn").removeClass("hidden");
    }

    $("#logout_btn").click(function(){
        logout();
    });
});

function logout() {
    localStorage.clear();
    window.location.href = "./index.html";
}

function getJsonFromUrl(url) {
    if(!url) url = location.search;
    var query = url.substr(1);
    var result = {};
    query.split("&").forEach(function(part) {
      var item = part.split("=");
      result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
}

function redirectAjaxError(jqXHR){
    switch (jqXHR.status) {
        case 401:
            var errText = jqXHR.status;
            if (jqXHR['responseJSON'] && jqXHR['responseJSON']['error']) {
                if (jqXHR['responseJSON']['error'].trim() === 'Expired token') {
                    localStorage.clear();
                    localStorage.setItem("error", "Token expired, please sign in again.");
                    window.location.href="./login.html";
                }

                else{
                    console.log("Server Error: ", jqXHR['responseJSON']['error']);
                    errText = jqXHR['responseJSON']['error'];
                    $("#msg_server_error").html(`Server Error: ${errText}`);
                    $("#alert_server_error").removeClass("hidden").addClass("show").fadeIn();
                    $("#alert_server_error .alert").removeClass("hidden").addClass("show").fadeIn();
                    $(".se-pre-con").fadeOut("slow");
                    $(".load-icon").fadeOut("slow");
                    close_alert_after_5();
                }
            }

        case 403:
            var errText = jqXHR.status;
            if (jqXHR['responseJSON'] && jqXHR['responseJSON']['error']) {
                console.log("Server Error: ", jqXHR['responseJSON']['error']);
                errText = jqXHR['responseJSON']['error'];
            }
            $("#msg_server_error").html(`Server Error: ${errText}`);
            $("#alert_server_error").removeClass("hidden").addClass("show").fadeIn();
            $("#alert_server_error .alert").removeClass("hidden").addClass("show").fadeIn();
            $(".se-pre-con").fadeOut("slow");
            $(".load-icon").fadeOut("slow");
            close_alert_after_5();
            break;
        case 404:
            if (jqXHR['responseJSON'] && jqXHR['responseJSON']['error']) {
                if (jqXHR['responseJSON']['error'].trim() === 'No such session') {
                    localStorage.clear();
                    localStorage.setItem("error", "Token expired, please sign in again.");
                    window.location.href="./login.html";
                } else {
                    $("#msg_server_error").html(`Server Error: ${jqXHR['responseJSON']['error']}`);
                    $("#alert_server_error").removeClass("hidden").addClass("show").fadeIn();
                    $("#alert_server_error .alert").removeClass("hidden").addClass("show").fadeIn();
                    $(".se-pre-con").fadeOut("slow");
                    $(".load-icon").fadeOut("slow");
                    close_alert_after_5();
                }
            } else {
                window.location.href="./404.html";
            }
            break;
        case 500:
            if (jqXHR['responseJSON'] && jqXHR['responseJSON']['error']) {
                $("#msg_server_error").html(`Server Error: ${jqXHR['responseJSON']['error']}`);
                $("#alert_server_error").removeClass("hidden").addClass("show").fadeIn();
                $("#alert_server_error .alert").removeClass("hidden").addClass("show").fadeIn();
                $(".se-pre-con").fadeOut("slow");
                $(".load-icon").fadeOut("slow");
                close_alert_after_5();
            } else {
                window.location.href="./500.html";
            }
            break;
        default:
            var errText = jqXHR.status;
            if (jqXHR['responseJSON'] && jqXHR['responseJSON']['error']) {
                console.log("Server Error: ", jqXHR['responseJSON']['error']);
                errText = jqXHR['responseJSON']['error'];
            }

            $("#msg_server_error").html(`Server Error: ${errText}`);
            $("#alert_server_error").removeClass("hidden").addClass("show").fadeIn();
            $("#alert_server_error .alert").removeClass("hidden").addClass("show").fadeIn();
            $(".se-pre-con").fadeOut("slow");
            $(".load-icon").fadeOut("slow");
            close_alert_after_5();
            break;
    }
}

function getAuthHeader() {
    var token = localStorage.getItem("token");
	var user_name = localStorage.getItem("user_name");
	if(user_name == undefined){
		localStorage.clear();
		localStorage.setItem("error","Try again");
		window.location.href="./login.html";
		return ;
	}
	return user_name + " "+token;
}

$(document).ready(function() {
	$(".alert button.close").on("click", function (e) {
		$(this).parent().fadeOut();
	});
});

function close_alert_after_5() {
    setTimeout(() => {
        $(".alert.show").each(function() {
            $(this).removeClass('show').addClass('hidden');
            $(this).closest('.alert-backdrop').removeClass('show').addClass('hidden');
        });
    }, 3000);
}

$("#btn_mobile_nav").click(function() {
    if ($(".div-background").hasClass("hidden")) {
        $(".nav-desktop").css("left", "0px");
        $(".div-background").removeClass("hidden");
    } else {
        $(".nav-desktop").css("left", "-300px");
        $(".div-background").addClass("hidden");
    }
})

$(".div-background").click(function() {
    $(".nav-desktop").css("left", "-300px");
    $(".div-background").addClass("hidden");
})

function textareaAutoResize(el, scroll, isContentEditable) {
    if(!isContentEditable) {
        el.style.height = 'auto'; // Reset the height to auto
        el.style.height = el.scrollHeight + 'px'; // Set the height to match the content
    }

    if (scroll) {
        scrollToBottom(el);
    }
}

function scrollToBottom(el) {
    // el.scrollTop = el.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
}

function createVideoModal(vid) {
    const videoTitle = vid +".mp4";
    const videoModalHTML = `
        <div class="modal fade" id="guideModal" role="dialog" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content" style="position: relative;">
                    <a type="button" class="close close-guide bg-dark" data-dismiss="modal">&times;</a>
                    <div class="modal-body" style="padding: 0;">
                        <video controls autoplay muted loop width="100%" style="display: block;">
                            <source src="/assets/${videoTitle}" type="video/mp4">
                            Sorry, your browser does not support embedded videos.
                        </video>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', videoModalHTML);
}



function closeAlertAndRemoveBackdrop(element) {
    $(element).closest('.alert-backdrop').removeClass('show').addClass('hidden');
}

function setAvatar() {
    var user_name = localStorage.getItem("user_name");
    if (user_name)  {
        $(".right-menu-wrapper").append(`
            <div class="desktop">
                <a class="pro-user" href="./profile.html"><i class="fa fa-fw fa-user"></i></a>
            </div>
        `);
    }
}
