$(function () {
  setAvatar();
  initMsg();
  getClients();
});

let clients;

function initMsg() {
  var result = getJsonFromUrl();
  if (result.success != undefined && result.name != undefined) {
    var name = result.name;
    var msg = `Client <strong>${name}</strong> added successfully`;
    $("#msg").html(msg);
    $("#alert").removeClass("hidden").addClass("show");
    $("#alert .alert").removeClass("hidden").addClass("show");
  }
}

function getClients() {
  $.ajax({
    url: "https://api.olyvhealth.com/clients",
    type: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.error == undefined) {
        $(".se-pre-con").fadeOut("slow");
        clients = response;
        genHtml(response);
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

function genHtml(clients) {
  let html = ``;
  clients.map((item) => {
    // var name = getName(item.name);
    html += `
            <tr data-name='${item.name}' data-id='${item.id}'>
                <td>${item.first_name}</td>
                <td>${item.last_name}</td>
                <td>
                    <div class="d-flex btn-group gap-3">
                        <button type="button" class="btn btn-success btn-select btn-start-session">
                            <span class="fa fa-fw fa-play mr-2"></span>Session
                        </button>
                        <button type="button" class="btn btn-info btn-select btn-review-notes">
                            <span class="fa fa-fw fa-folder mr-2"></span>Notes
                        </button>
                        <button type="button" class="btn btn-info btn-select btn-generate-report">
                            <span class="fa fa-fw fa-file mr-2"></span>Reports
                        </button>
                        <button type="button" class="btn btn-danger btn-select btn-delete-client" onclick="confirmDeleteClient('${item.id}')">
                            <span class="fa fa-fw fa-trash mr-2"></span>Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
  });
  $("#table tbody").html(html);
}

function confirmDeleteClient(clientId) {
  $("#delete_client_id").val(clientId);
  $("#confirmDeleteModal").modal("show");
}

function deleteClient() {
  const clientId = $("#delete_client_id").val();
  $.ajax({
    url: "https://api.olyvhealth.com/client_delete",
    type: "POST",
    data: JSON.stringify({
      client_id: clientId,
    }),
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      clients = clients.filter((client) => client.id !== clientId);
      genHtml(clients);
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function getName(str) {
  var units = str.split(" ");
  if (units.length == 2) {
    return {
      firstName: units[0],
      lastName: units[1],
    };
  } else {
    return {
      firstName: str,
      lastName: "",
    };
  }
}

function addClient() {
  $(".se-pre-con").fadeIn("slow");
  setTimeout(function () {
    $(".se-pre-con").fadeOut("slow");
  }, 300);
  window.location.href = "./add_client.html";
}

$(document).ready(function () {
  $("table tbody").on(
    "click",
    "button.btn-select:not(.btn-delete-client)",
    function () {
      $(".se-pre-con").fadeIn("slow");
      var client_name = $(this).parents("tr").data("name");
      var client_id = $(this).parents("tr").data("id");

      localStorage.setItem("client_name", client_name);
      localStorage.setItem("client_id", client_id);
      setTimeout(function () {
        $(".se-pre-con").fadeOut("slow");
      }, 200);
      if ($(this).hasClass("btn-start-session")) {
        window.location.href = "./session.html";
      }
      if ($(this).hasClass("btn-review-notes")) {
        window.location.href = "./notes.html";
      }
      if ($(this).hasClass("btn-generate-report")) {
        window.location.href = "./report.html";
      }
    }
  );
});



$("#guide").click(function() {
    createVideoModal("client");
    $("#guideModal").modal({
        backdrop: 'static',
        keyboard: true
    });
})