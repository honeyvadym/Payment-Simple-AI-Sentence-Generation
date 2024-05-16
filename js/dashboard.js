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
    var obs_written = response.obs_written;
    var obs_reviewed = response.obs_reviewed;
    var verified = response.verified;
    credits = getNumberFormat(credits.toFixed(2));
    obsw = getNumberFormat(obs_written.toFixed(2));
    obsr = getNumberFormat(obs_reviewed.toFixed(2));
    $("#my_credit").text(credits);
    $("#num_obs_w").text(obsw);
    $("#num_obs_r").text(obsr);


    var is_trial = localStorage.getItem("is_trial");

}


