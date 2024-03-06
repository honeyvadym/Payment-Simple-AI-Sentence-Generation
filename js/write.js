$(function () {
  setAvatar();
  initMsg();
  getOptions();
  getBlocks();
});

let options;
var allTemplates = null;
var speed = 25;
var currentTemplateId = null;
var clickEvenKey = false;
var isReportEdited = false;
window.jsPDF = window.jspdf.jsPDF;
var pdf_doc = new jsPDF("p", "mm", "a4");
var isReportEdited = false;

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
        let html = "";
        const { options } = response;
        for (let i = 0; i < options.length; i++) {
          const option = options[i];
          html += `<label htmlFor="${option.name}">${option.name}:</label>
          <select id="${option.name}">`;
          for (let j = 0; j < option.options.length; j++) {
            const child = option.options[j];
            const isSelected = child === option?.default ? "selected" : "";
            html += `<option key="${j}" value="${child}" ${isSelected}>${child}</option>`;
          }
          html += "</select>";
        }
        $("#options-box").html(html);
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

function getBlocks() {
  $.ajax({
    url: `https://api.toddles.cloud/blocks`,
    type: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.blocks) {
        var $ul_block = $("ul.block-list");
        $ul_block.html("");
        allBlocks = response.blocks;
        var blockKeys = Object.keys(response.blocks);
        for (let i = 0; i < blockKeys.length; i++) {
          $ul_block.append(`
						<li data='${blockKeys[i]}' class='block-list-item btn'>
							<span class="block">${blockKeys[i]}</span>
						</li>
					`);
        }
      } else {
        console.error(response);
      }
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function process() {
  const selectedOptions = $("#options-box select")
    .map(function () {
      return { name: $(this).attr("id"), value: $(this).val() };
    })
    .get();
  const inputQuery = $("#myTextarea").text().trim();
  if (selectedOptions && inputQuery) {
    $(".se-pre-con").fadeIn("slow");
    $.ajax({
      url: "https://api.toddles.cloud/process",
      type: "POST",
      data: JSON.stringify({
        options: selectedOptions,
        input_query: inputQuery,
      }),
      headers: {
        Authorization: getAuthHeader(),
      },
      success: function (response) {
        if (response.success) {
          $("#options-box").addClass("hidden");
          $("#process-btn-box").addClass("hidden");
          $("#export-btn-box").removeClass("hidden");
          $("#myTextarea").html(translateDOM(response.response));
          textareaAutoResize($(".report-result-content")[0]);
          blockDragStart();
          $(".se-pre-con").fadeOut("slow");
          options = response;
          console.log("process", response);
        } else {
          console.log("process", response);
          // localStorage.clear();
          // localStorage.setItem("error", "Try again");
          // window.location.href="./login.html";
        }
      },
      error: function (jqXHR, exception) {
        redirectAjaxError(jqXHR);
      },
    });
  } else {
    $("#msg_drafts_error").html("Error! Please fill out all input tags.");
    $("#alert_drafts_error").removeClass("hidden").addClass("show").fadeIn();
    $("#alert_drafts_error .alert")
      .removeClass("hidden")
      .addClass("show")
      .fadeIn();
    close_alert_after_5();
  }
}

function reset() {
  $(".se-pre-con").fadeIn();
  $("#options-box").removeClass("hidden");
  $("#process-btn-box").removeClass("hidden");
  $("#export-btn-box").addClass("hidden");
  $("#myTextarea").html("");
  textareaAutoResize($(".report-result-content")[0]);
  $(".se-pre-con").fadeOut("slow");
}

function genHtml(options) {
  let html = ``;
  options.map((item) => {
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

$("#guide").click(function () {
  createVideoModal("client");
  $("#guideModal").modal({
    backdrop: "static",
    keyboard: true,
  });
});

function blockDragStart() {
  var $fT = $("#myTextarea");

  makeDrag($(".block-list li"));

  $(".custom-block").draggable({
    revert: function (validDrop) {
      if (!validDrop || clickEvenKey) {
        makeText($fT, true);
      }
      return !validDrop || clickEvenKey;
    },
    helper: "clone",
    cursor: "pointer",
    start: function (e, ui) {
      $("#myTextarea").html(
        $("#myTextarea")
          .html()
          .replace(/<div>/g, "<br>")
          .replace(/<\/div>/g, "")
      );
      makeDrop($fT, true);
      $(".custom_block").remove();
      if (!$(ui.helper).hasClass("flash-cursor")) {
        document.addEventListener("keyup", triggerMouseUpOnESC);
      }
      $(ui.helper).addClass("block-dragging");
    },
    stop: function (event, ui) {
      $(ui.helper).removeClass("block-dragging");
      document.removeEventListener("keyup", triggerMouseUpOnESC);
    },
  });

  $("#blockListButton").show();
}

function makeDrag($item) {
  $item.draggable({
    revert: function (validDrop) {
      if (!validDrop || clickEvenKey) {
        makeText($("#myTextarea"), true);
      }
      return !validDrop || clickEvenKey;
    },
    helper: "clone",
    cursor: "pointer",
    start: function (e, ui) {
      $("#myTextarea").html(
        $("#myTextarea")
          .html()
          .replace(/<div>/g, "<br>")
          .replace(/<\/div>/g, "")
      );
      makeDrop($("#myTextarea"));
      $(".custom_block").remove();
      $(ui.helper).addClass("block-dragging");
      if (!$(ui.helper).hasClass("flash-cursor")) {
        document.addEventListener("keyup", triggerMouseUpOnESC);
      }
    },
    stop: function (event, ui) {
      $(ui.helper).removeClass("block-dragging");
      document.removeEventListener("keyup", triggerMouseUpOnESC);
      clickEvenKey = false;
    },
  });
}

const triggerMouseUpOnESC = (evt) => {
  if (evt.key === "Escape") {
    const clickEvent = document.createEvent("MouseEvents");
    clickEvent.initEvent("mouseup", true, true);
    document.dispatchEvent(clickEvent);
    clickEvenKey = true;
  }
};

function makeDrop($item, custom = false) {
  if ($item.hasClass("noEdit")) {
    return false;
  }
  $item.addClass("noEdit").attr("contenteditable", false);
  var words = $item.html().split("<br>");
  $item.html("");
  var i = 0;
  if (words.length > 1 && words[words.length - 1] === "") {
    words.pop();
  }
  $.each(words, function (k, v) {
    var w = $("<span>", {
      class: "word word-" + k,
    }).html(v + "<br>");
    w.appendTo($item);
    i++;
  });
  $item.find(".word").droppable({
    drop: function (e, ui) {
      isReportEdited = true;
      setTimeout(() => {
        if (!clickEvenKey) {
          $("#blocksList").hide();
          $("#blockListButton img").show();
          if (custom) {
            $(e.target).removeClass("flash-cursor");
            newWord =
              '<span contenteditable="false" class="custom_block"><textarea placeholder="Prompt Olyv to extract any information you require, for example: Summarise relevant information of the treatment for the client in 30 words" rows="3" id="custom_block_name" ></textarea><button class="btn btn-info" onclick="getCustomPrompt()" id="get_prompt"><img style="display: none;" class=\'docs-detail-list-img\' src=\'./images/spinner.svg\'>Go!</button></span>';
            $(e.target).before(
              $("<span>", {
                class: "new word",
              }).html(newWord)
            );
            makeText($("#myTextarea"), true);
            $("#blockListButton img").hide();
            textareaAutoResize($(".report-result-content")[0], false, true);
          } else {
            getPrompt(ui.draggable.attr("data"))
              .then(function (droppedHtml) {
                $(e.target).removeClass("flash-cursor");
                var i = 0;
                var newWord = "";
                function typeWriter() {
                  if (i < droppedHtml.length) {
                    newWord += droppedHtml.charAt(i);
                    if (i === 0) {
                      $(e.target).before(
                        $("<span>", {
                          class: "new word",
                        }).html(newWord)
                      );
                      // $(e.target).before($("<br>"));
                      textareaAutoResize(
                        $(".report-result-content")[0],
                        false,
                        false
                      );
                    } else {
                      $("#myTextarea span.new.word").html(newWord);
                      textareaAutoResize(
                        $(".report-result-content")[0],
                        false,
                        false
                      );
                    }
                    i++;
                    setTimeout(typeWriter, speed);
                  } else {
                    makeText($("#myTextarea"), true, true);
                    $("#blockListButton img").hide();
                  }
                }
                typeWriter();
              })
              .catch(function (error) {
                console.error(error);
                makeText($("#myTextarea"), true, true);
              });
          }
        } else {
          makeText($("#myTextarea"), true, true);
          clickEvenKey = false;
        }
      }, 10);
    },
    over: function (event, ui) {
      $(this).addClass("flash-cursor");
      $(document).on("keydown.escape", function (e) {
        if (e.key === "Escape") {
          ui.helper.animate(
            { position: "unset" },
            {
              duration: 0,
              complete: function () {
                console.log("Animation complete");
              },
            }
          );
          clickEvenKey = true;
          $(document).off("keydown.escape");
        }
      });
      textareaAutoResize($(".report-result-content")[0], false, false);
    },
    out: function (event, ui) {
      $(this).removeClass("flash-cursor");
      textareaAutoResize($(".report-result-content")[0], false, false);
    },
  });
}

function makeText($item, isDropped = false, addBr = false) {
  var words = "";
  $item.find("span.word").each(function (i) {
    words += $(this).html();
    if (
      addBr &&
      $(this).hasClass("new") &&
      i !== $item.find("span.word").length - 1
    ) {
      words += "<br><br>";
    }
  });
  if (words !== "") {
    $item.html(words);
    textareaAutoResize($(".report-result-content")[0], false, false);
  }
  if (isDropped) {
    $item.removeClass("noEdit").attr("contenteditable", true);
  }
}

$(function () {
  $("#blockListButton").on("click", function () {
    if ($("#myTextarea").hasClass("noEdit")) {
      return false;
    }
    $("#blocksList").toggle();
  });
  $(document).on("click", function (e) {
    if (
      e.target !== $("#blockListButton")[0] &&
      e.target !== $("#blocksList")[0] &&
      !$.contains($("#blockListButton")[0], e.target) &&
      !$.contains($("#blocksList")[0], e.target)
    ) {
      $("#blocksList").hide();
    }
  });
  $("#search_block").on("keyup", function (e) {
    if (e.target.value) {
      var $ul_block = $("ul.block-list");
      $ul_block.html("");
      if (allBlocks && allBlocks.length) {
        allBlocks
          .filter((b) => b.indexOf(e.target.value.toLowerCase()) > -1)
          .map((block) => {
            $ul_block.append(`
                            <li data='${block}' class='block-list-item btn'>
                                <span class="">${block}</span>
                            </li>
                        `);
          });
      }
    } else {
      var $ul_block = $("ul.block-list");
      $ul_block.html("");
      if (allBlocks && allBlocks.length) {
        allBlocks.map((block) => {
          $ul_block.append(`
                            <li data='${block}' class='block-list-item btn'>
                                <span class="">${block}</span>
                            </li>
                        `);
        });
      }
    }
    makeDrag($(".block-list li"));
  });
  $("#search_block").on("click", function (e) {
    this.select();
  });
});

$("#myTextarea").on("keydown", function (event) {
  var selection = window.getSelection();
  var range = selection.getRangeAt(0);
  // var emptyBlock = range.endContainer;
  var block = range.startContainer.parentNode;
  var allowedKeys = [
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "PageUp",
    "PageDown",
    "Home",
    "End",
    "Enter",
    "Tab",
    "Escape",
  ];

  if ($(block).hasClass("added-block")) {
    if (event.key === "Backspace" || event.key === "Delete") {
      $(block).remove();
      textareaAutoResize($(".report-result-content")[0]);
    } else if (event.key === "Enter") {
      event.preventDefault();
      var newBr = $('<br split="1">');
      $(block).after(newBr);
      if (range.startOffset === 0) {
        $(block).before(newBr);
      } else {
        $(block).after(newBr);
      }
      moveCursorNextToElement(newBr);
    } else if (!allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }
  // else if ($(emptyBlock).hasClass('custom added-block')) {
  // 	console.log("TEXT", $(emptyBlock).text())
  // }
});

function moveCursorNextToElement(element) {
  var range = document.createRange();
  var sel = window.getSelection();
  range.setStartAfter(element[0]);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  textareaAutoResize($(".report-result-content")[0]);
}

function getKeyByValue(object, value) {
  return Object.keys(object).find((key) => object[key] === value);
}

function translateDOM(str) {
  return str.replace(/\n/g, "<br>");
}

$("#myTextarea").on("input", function () {
  isReportEdited = true;
  textareaAutoResize($(".report-result-content")[0], true, false);
});

async function exportHTML(type, filename = "") {
  var $el = $(".report-result-content").clone(true, false);
  // $el.find(".non-export").remove();
  $el.removeClass("shadow-box");
  $el.css("border", "none");
  // var content = "<div>" + $(".report-result-content").html() + "</div>";
  // var timeStamp = new Date(Number(localStorage.getItem('draft_time')) * 1000);
  // var date = timeStamp.getFullYear() + "-" + (timeStamp.getMonth() + 1) + "-" + timeStamp.getDate();
  var date = $("#page_subtitle").text();
  var clientName = localStorage.getItem("client_name")
    ? localStorage.getItem("client_name").replace(" ", "-")
    : "no-name";
  if (type == "doc") {
    var preHtml =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
    var postHtml = "</body></html>";
    var html =
      preHtml + "<div>" + $(".report-result-content").html() + "</div>";
    +postHtml;

    var blob = new Blob(["\ufeff", html], {
      type: "application/msword",
    });

    // Specify link url
    var url =
      "data:application/vnd.ms-word;charset=utf-8," + encodeURIComponent(html);

    // Specify file name
    filename = filename
      ? filename + ".doc"
      : "report-export-" + clientName + "-" + date + ".doc";

    // Create download link element
    var downloadLink = document.createElement("a");

    document.body.appendChild(downloadLink);

    if (navigator.msSaveOrOpenBlob) {
      navigator.msSaveOrOpenBlob(blob, filename);
    } else {
      // Create a link to the file
      downloadLink.href = url;

      // Setting the file name
      downloadLink.download = filename;

      //triggering the function
      downloadLink.click();
    }

    document.body.removeChild(downloadLink);
  }

  if (type === "pdf") {
    const element = document.querySelector(".report-result-content");
    let y = 20; // Starting y position

    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const lines = pdf_doc.splitTextToSize(
          child.textContent.trim(),
          pdf_doc.internal.pageSize.getWidth() - 40
        );
        for (let line of lines) {
          if (y > 280) {
            pdf_doc.addPage();
            y = 20;
          }

          // Optionally set font, font size, and other properties
          pdf_doc.setFontSize(12);
          pdf_doc.setFont("times");

          pdf_doc.text(line, 20, y);

          y += 8; // Adjust line spacing
        }
      } else if (child.tagName === "BR") {
        y += 3;
      } else if (child.tagName === "IMG") {
        const imgData = await getImageBase64(child.src, child.width, 600);
        if (y + child.height / 4 > 280) {
          pdf_doc.addPage();
          y = 20;
        }
        pdf_doc.addImage(
          imgData,
          "JPEG",
          20,
          y,
          child.width / 4,
          child.height / 4
        );
        y += child.height / 4 + 10;
      }
    }
    filename = filename
      ? filename + ".pdf"
      : "report-export-" + clientName + "-" + date + ".pdf";

    pdf_doc.save(filename);
  }
  $el.remove();
}

function getPrompt(blockName) {
  return new Promise(function (resolve, reject) {
    if (blockName) {
      $.ajax({
        url: `https://api.toddles.cloud/prompt?query=${blockName}`,
        timeout: 60000,
        type: "GET",
        headers: {
          Authorization: getAuthHeader(),
        },
        success: function (response) {
          if (response.success) {
            resolve(translateDOM(response.response));
          } else {
            console.error(response);
            reject(false);
          }
        },
        error: function (jqXHR, exception) {
          redirectAjaxError(jqXHR);
          reject(false);
        },
      });
    } else {
      reject(false);
    }
  });
}

function getCustomPrompt() {
  $("#get_prompt img").show();
  $("#get_prompt").prop("disabled", true);
  $("#custom_block_name").prop("disabled", true);
  $("#myTextarea").addClass("noEdit").attr("contenteditable", false);
  $("#blockListButton img").show();
  $.ajax({
    url: `https://api.toddles.cloud/prompt?query=custom%7C${$(
      "#custom_block_name"
    ).val()}`,
    type: "GET",
    timeout: 60000,
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.success) {
        var prompt = translateDOM(response.response);
        var i = 0;
        var newWord = "";
        function typeWriter() {
          if (i < prompt.length) {
            newWord += prompt.charAt(i);
            $("#myTextarea .custom_block").html(newWord);
            i++;
            setTimeout(typeWriter, speed);
            textareaAutoResize($(".report-result-content")[0], false, true);
          } else {
            $(".custom_block").hide();
            $(".custom_block").before(prompt);
            $(".custom_block").before($("<br><br>"));
            $("#myTextarea")
              .removeClass("noEdit")
              .attr("contenteditable", true);
            $(".custom_block").remove();
            $("#blockListButton img").hide();
            textareaAutoResize($(".report-result-content")[0], false, true);
          }
        }
        typeWriter();
      } else {
        console.error(response);
      }
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
      $("#get_prompt img").hide();
      $("#get_prompt").prop("disabled", false);
      $("#custom_block_name").prop("disabled", false);
      $("#myTextarea").removeClass("noEdit").attr("contenteditable", true);
      $("#blockListButton img").hide();
    },
  });
}
