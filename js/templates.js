var allTemplates = null;
var speed = 25;
var allBlocks = null;
var currentTemplateId = null;
var clickEvenKey = false;
var isTemplateEdited = false;

$(function () {
  getTemplates();
  getBlocks();
  setAvatar();
});

function getTemplates() {
  if (allTemplates === null) {
    $.ajax({
      url: "https://api.olyvhealth.com/templates",
      type: "GET",
      headers: {
        Authorization: getAuthHeader(),
      },
      success: function (response) {
        if (response.success == true) {
          $(".se-pre-con").fadeOut("slow");
          allTemplates = response.templates;
          genHtml(response.templates);
        } else {
          $("#table").addClass("hidden");
          $("#alert_template_info")
            .removeClass("hidden")
            .addClass("show")
            .fadeIn();
          $("#alert_template_info .alert")
            .removeClass("hidden")
            .addClass("show")
            .fadeIn();
          $(".se-pre-con").fadeOut("slow");
          $(".load-icon").fadeOut();
          close_alert_after_5();
        }
      },
      error: function (jqXHR, exception) {
        redirectAjaxError(jqXHR);
      },
    });
  } else {
    genHtml(allTemplates);
  }
}

function getBlocks() {
  $.ajax({
    url: `https://api.olyvhealth.com/blocks`,
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
						<li data='${response.blocks[blockKeys[i]]}' class='block-list-item btn'>
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

function translateDOM(str) {
  return str.replace(/\n/g, "<br>");
}

function genHtml(response) {
  $("#table tbody").html("");
  if (response.length > 0) {
    $("#table").removeClass("hidden");
    var html = ``;
    response.map((item) => {
      html += `
				<tr data-title='${item.title}' data-id='${item.id}'>
					<td>${item.title}</td>
					<td>${item.last_modified}</td>
					<td>
						<div class="btn-group"> 
							<button onclick="goEditTemplatePage('${item.id}')" class="btn btn-info btn-select mr-2">
								<span class="fa fa-fw fa-file mr-2"></span>Edit
							</button>
							<button onclick="confirmDeleteTemplate('${item.id}')" class="btn btn-danger btn-select ">
								<span class="fa fa-fw fa-trash mr-2"></span>Delete
							</button>
						</div>
					</td>
				</tr>
			`;
    });
    $("#table tbody").html(html);
  } else {
    $("#table").addClass("hidden");
    $("#alert_template_info").removeClass("hidden").addClass("show").fadeIn();
    $("#alert_template_info .alert")
      .removeClass("hidden")
      .addClass("show")
      .fadeIn();
  }
  $(".load-icon").fadeOut("slow");
  close_alert_after_5();
}

function goEditTemplatePage(templateId) {
  $(".alert-backdrop").fadeOut();
  $(".alert").fadeOut();
  $(".load-icon").css("display", "");
  $("#btn_create_template").addClass("hidden");

  if (templateId && allTemplates.filter((item) => item.id === templateId)[0]) {
    currentTemplateId = templateId;
    $(".btn-save-template").data("template-id", templateId);
    var currentTemplate = allTemplates.filter(
      (item) => item.id === templateId
    )[0];
    setPageHeader(false, currentTemplate.title, currentTemplate.last_modified);
    $(".template-edit-title").html(currentTemplate.title);
    $(".template-edit-date").html(currentTemplate.last_modified);
    var content = "";
    currentTemplate.sections.map((s) => {
      if (s.type === "block") {
        content +=
          '<span class="added-block" block-key="'+s.content+'" >' + allBlocks[s.content] + '</span><br split="1">';
      } else if (s.type === "text") {
        content += s.content + '<br split="1">';
      } else {
        content +=
          '<span class="added-block custom" >' +
          s.content +
          '</span><br split="1">';
      }
    });
    if (content !== "") {
      $("#myTextarea").html(content);
    } else {
      $("#myTextarea").html("");
    }
    setTimeout(() => {
      textareaAutoResize($(".template-edit-content")[0]);
    }, 20);
    blockDragStart();
    $(".load-icon").fadeOut();
  }

  setIsTemplateEdited(false);
  $(".templates-section").addClass("hidden");
  $(".template-edit-section").removeClass("hidden");
}

function saveTemplate() {
  var sections = [];
  var html = $("#myTextarea")
    .html()
    .replace(/<div>/g, '<br split="1" />')
    .replace(/<\/div>/g, "");
  html = html.split('<br split="1">');
  html.map((h) => {
    if (h !== "" && h !== '<br split="1">') {
      if (h.indexOf("added-block") > -1) {
        if (h.indexOf("custom") > -1) {
          sections.push({
            type: "custom-block",
            content: $(h).html(),
          });
        } else {
          sections.push({
            type: "block",
            content: $(h).attr('block-key'),
          });
        }
      } else {
        sections.push({
          type: "text",
          content: h,
        });
      }
    }
  });
  // $("#myTextarea").find("span.added-block").each(function(i) {
  // 	sections.push($(this).text());
  // });
  if (sections.length === 0) {
    $("#alert_template_result_warning")
      .removeClass("hidden")
      .addClass("show")
      .fadeIn();
    $("#alert_template_result_warning .alert")
      .removeClass("hidden")
      .addClass("show")
      .fadeIn();
    close_alert_after_5();
    return;
  }
  $("#blockListButton").hide();
  $(".load-icon").fadeIn();
  $.ajax({
    url: `https://api.olyvhealth.com/template_save`,
    type: "POST",
    headers: {
      Authorization: getAuthHeader(),
    },
    data: JSON.stringify({
      id: currentTemplateId,
      sections: sections,
    }),
    success: function (response) {
      if (response.success) {
        var tempAll = [];
        allTemplates.map((t) => {
          if (t.id === currentTemplateId) {
            tempAll.push({ ...t, sections: [...sections] });
          } else {
            tempAll.push(t);
          }
        });
        allTemplates = [...tempAll];
        $("#alert_template_result_success")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        $("#alert_template_result_success .alert")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        isTemplateEdited = false;
      } else {
        $("#alert_template_result_error")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        $("#alert_template_result_error .alert")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        $(".alert_template_result_error_msg").text(
          "Error! " + response.error ? response.error : "An error occured."
        );
        console.error(response);
      }
      $(".load-icon").fadeOut();
      setTimeout(() => {
        $("#blockListButton").show();
      }, 500);
      close_alert_after_5();
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function setIsTemplateEdited(bool) {
  isTemplateEdited = bool;
}

function createNewTemplate() {
  $(".new-template-title").val("");
  $(".load-icon").css("display", "none");
  $("#btn_create_template").addClass("hidden");
  $(".template-edit-section").addClass("hidden");
  $(".templates-section").addClass("hidden");
  $("#blockListButton").hide();
  $(".templates-box .alert-backdrop").removeClass("show").addClass("hidden");
  $(".templates-box .alert").removeClass("show").addClass("hidden");
  $(".new-template-section").removeClass("hidden");
}

$("#myTextarea").on("input", function () {
  setIsTemplateEdited(true);
  textareaAutoResize($(".template-edit-content")[0]);
});

function confirmDeleteTemplate(templateId) {
  $("#delete_template_id").val(templateId);
  $("#confirmDeleteModal").modal("show");
}

function deleteTemplate() {
  $(".load-icon").fadeIn();
  var templateId = $("#delete_template_id").val();
  $.ajax({
    url: `https://api.olyvhealth.com/template_delete`,
    type: "POST",
    data: JSON.stringify({
      id: templateId,
    }),
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.error == undefined) {
        allTemplates = [...allTemplates.filter((a) => a.id !== templateId)];
        $("#msg_template_success").html(
          "Success! The template has been deleted"
        );
        $("#alert_template_success")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        $("#alert_template_success .alert")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        getTemplates();
      } else {
        $("#msg_template_error").html(
          "Error! " + response.error ? response.error : "An error occured."
        );
        $("#alert_template_error")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        $("#alert_template_error .alert")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        console.log(response.error);
        $(".load-icon").fadeOut();
        close_alert_after_5();
      }
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function setPageHeader(reset, title, subtitle) {
  if (reset) {
    $("#page_title").html("Templates");
    $("#page_subtitle").html("You can generate templates");
    $(".template-detail-heading").css("display", "none");
    $(".template-list-heading").fadeIn("slow");
  } else {
    $("#page_title").html(title);
    $("#page_subtitle").html(subtitle);
    $(".template-list-heading").css("display", "none");
    $(".template-detail-heading").fadeIn("slow");
  }
}

function blockDragStart() {
  var $fT = $("#myTextarea");

  makeDrag($(".block-list li"));

  $(".custom-block").draggable({
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
          .replace(/<div>/g, '<br split="1">')
          .replace(/<\/div>/g, "")
      );
      makeDrop($fT, true);
      if (!$(ui.helper).hasClass("flash-cursor")) {
        document.addEventListener("keyup", triggerMouseUpOnESC);
      }
      $(ui.helper).addClass("block-dragging");
    },
    stop: function (event, ui) {
      $(ui.helper).removeClass("block-dragging");
      document.removeEventListener("keyup", triggerMouseUpOnESC);
      clickEvenKey = false;
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
          .replace(/<div>/g, '<br split="1">')
          .replace(/<\/div>/g, "")
      );
      makeDrop($("#myTextarea"));
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
  var words = $item.html().split('<br split="1">');
  $item.html("");
  var i = 0;
  if (words.length > 1 && words[words.length - 1] === "") {
    words.pop();
  }
  $.each(words, function (k, v) {
    var w = $("<span>", {
      class: "word word-" + k,
    }).html(v + '<br split="1">');
    w.appendTo($item);
    i++;
  });

  $item.find(".word").droppable({
    drop: function (e, ui) {
      isTemplateEdited = true;
      setTimeout(() => {
        if (!clickEvenKey) {
          $("#blocksList").hide();
          $("#blockListButton img").show();
          var dropText = "";
          var dropClass = "new word";
          if (custom) {
            dropText = "eg: Summarise relevant information of the treatment for the client in 30 words";
            dropClass += " custom";
          } else {
            dropText = ui.draggable.attr("data");
          }
          $(e.target).removeClass("flash-cursor");
          var i = 0;
          var newWord = "";
          function typeWriter() {
            if (i < dropText.length) {
              newWord += dropText.charAt(i);
              if (i === 0) {
                $(e.target).before(
                  $("<span>", {
                    class: dropClass,
                  }).html(newWord)
                );
                textareaAutoResize($(".template-edit-content")[0]);
              } else {
                $("#myTextarea span.new.word").html(newWord);
                textareaAutoResize($(".template-edit-content")[0]);
              }
              i++;
              setTimeout(typeWriter, speed);
            } else {
              makeText(
                $("#myTextarea"),
                true,
                $(e.target).children(".added-block").length === 0
              );
              $("#blockListButton img").hide();
            }
          }
          typeWriter();
        } else {
          makeText($("#myTextarea"), true);
          clickEvenKey = false;
        }
      }, 10);
    },
    over: function (event, ui) {
      $(this).addClass("flash-cursor");
      textareaAutoResize($(".template-edit-content")[0]);
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
          $(document).off("keydown.escape");
          clickEvenKey = true;
        }
      });
    },
    out: function (event, ui) {
      $(this).removeClass("flash-cursor");
      textareaAutoResize($(".template-edit-content")[0]);
    },
  });
}

function makeText($item, isDropped = false, addBr = false) {
  var words = "";
  $item.find("span.word").each(function (i) {
    if ($(this).hasClass("new")) {
      const key = getKeyByValue(allBlocks, $(this).text().trim());
      words += `<span class="added-block ${
        $(this).hasClass("custom") ? "custom" : ""
      }" block-key="${key}" >${$(this).html()}</span><br split="1">`;
    } else {
      words += $(this).html();
    }
  });
  if (words !== "") {
    $item.html(words);
    textareaAutoResize($(".template-edit-content")[0]);
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
    if (
      $(e.target).hasClass("added-block custom") &&
      $(".active-custom-block").length === 0
    ) {
      if (!$(e.target).children("textarea").hasClass("active-custom-block")) {
        var textarea = $("<textarea></textarea>");
        var height = $(e.target).height();
        var originText = e.target.innerText;
        $(e.target).html(textarea);
        textarea.addClass("active-custom-block");
        textarea.css("display", "block");
        textarea.val(originText);
        textarea.focus();
        textarea.select();
        textarea.css("height", height + "px");
        e.target.style.height = height + 3 + "px";
        textarea.on("keyup", function (ev) {
          ev.target.style.height = "auto";
          ev.target.style.height = ev.target.scrollHeight + 5 + "px";
          e.target.style.height = ev.target.scrollHeight + 5 + "px";
        });
        textarea.on("focusout", function (eve) {
          $(e.target).html(translateDOM(textarea.val()));
          $(e.target).css("height", "auto");
          textarea.hide();
        });
      }
    } else if (!$(e.target).hasClass("active-custom-block")) {
      // var textarea = $("textarea.active-custom-block")
      // if (textarea.length) {
      // 	textarea.parent().html(translateDOM(textarea.val()))
      // 	console.log(textarea.parent())
      // 	textarea.parent().css('height', 'auto');
      // 	textarea.parent().css('color', 'red');
      // 	textarea.hide();
      // }
    }
  });

  $("#search_block").on("keyup", function (e) {
    if (e.target.value) {
      var $ul_block = $("ul.block-list");
      $ul_block.html("");
      if (allBlocks) {
        var blockKeys = Object.keys(allBlocks);
        blockKeys
          .filter((b) => b.indexOf(e.target.value.toLowerCase()) > -1)
          .map((block) => {
            $ul_block.append(`
                            <li data='${allBlocks[block]}' class='block-list-item btn'>
                                <span class="block">${block}</span>
                            </li>
                        `);
          });
      }
    } else {
      var $ul_block = $("ul.block-list");
      $ul_block.html("");

      if (allBlocks) {
        var blockKeys = Object.keys(allBlocks);
        blockKeys.map((block) => {
          $ul_block.append(`
                            <li data='${allBlocks[block]}' class='block-list-item btn'>
                                <span class="block">${block}</span>
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
      textareaAutoResize($(".template-edit-content")[0]);
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
  textareaAutoResize($(".template-edit-content")[0]);
}

$(".btn-confirm").click(function () {
  showTemplateList();
});

function goBackToTemplateList(newTemplate = null, clearAlert = true) {
  if (clearAlert) {
    $(".alert-backdrop").fadeOut();
    $(".alert").fadeOut();
  }
  if (isTemplateEdited) {
    $("#confirmModal").modal({
      backdrop: "static",
    });
    return;
  }
  if (newTemplate !== null) {
    allTemplates = [newTemplate, ...allTemplates];
  }
  showTemplateList();
}

function showTemplateList() {
  $(".load-icon").fadeIn();
  $("#blockListButton").hide();
  setTimeout(async () => {
    isTemplateEdited = false;
    await getTemplates();
    $(".template-edit-section").addClass("hidden");
    $(".new-template-section").addClass("hidden");
    setPageHeader(true);
    $(".templates-section").removeClass("hidden");
    $("#btn_create_template").removeClass("hidden");
  }, 50);
}

function sendCreateTemplateRequest() {
  var $templateTitle = $(".new-template-title").val();
  if (!$templateTitle) {
    showNewTemplateAlert("warning");
    return;
  }
  $(".load-icon").fadeIn();
  var requestData = {
    title: $templateTitle,
  };
  $.ajax({
    url: `https://api.olyvhealth.com/template`,
    type: "POST",
    data: JSON.stringify(requestData),
    headers: {
      Authorization: getAuthHeader(),
    },
    success: function (response) {
      if (response.success == true) {
        $("#msg_template_success").html(
          "Success! New template has been created"
        );
        $("#alert_template_success")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();
        $("#alert_template_success .alert")
          .removeClass("hidden")
          .addClass("show")
          .fadeIn();

        goBackToTemplateList(response, false);
      } else {
        showNewTemplateAlert(
          "error",
          "Error! " + response.error ? response.error : "An error occured."
        );
        console.log(response.error);
      }
      $(".load-icon").fadeOut();
      close_alert_after_5();
    },
    error: function (jqXHR, exception) {
      redirectAjaxError(jqXHR);
    },
  });
}

function showNewTemplateAlert(status, msg) {
  var $alertEl = $(".new-template-section").find(
    `#alert_new_template_${status}`
  );
  var $messageEl = $alertEl.find("span").eq(0);
  $alertEl.removeClass("hidden").addClass("show").fadeIn();
  close_alert_after_5();
  if (msg) {
    $messageEl.html(msg);
  }
}


function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}



$("#guide").click(function() {
    createVideoModal("template");
    $("#guideModal").modal({
        backdrop: 'static',
        keyboard: true
    });
})