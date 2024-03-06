var curOpenIndex = undefined;
var questionCount = 0;
var clearTimerId = undefined;
var curPro = 0;
$(function () {
  $(".question-item .progress").css("width", "0%");
  $(".question-item .card-body").addClass("hidden");
  $(".question-item .card-head").addClass("not_select");
  questionCount = $(".question-item").length;
  startTimerFunction(0);
});

function startTimerFunction(index) {
  if (curOpenIndex == index) return;
  if (clearTimerId != undefined) {
    clearTimeout(clearTimerId);
  }
  if (curOpenIndex != undefined) {
    $(".question-item").eq(curOpenIndex).find(".progress").css("width", "0%");
    $(".question-item").eq(curOpenIndex).find(".card-body").addClass("hidden");
    $(".question-item")
      .eq(curOpenIndex)
      .find(".card-head")
      .addClass("not_select");
    $(".question-item")
      .eq(curOpenIndex)
      .find(".fa-chevron-up")
      .addClass("fa-chevron-down")
      .removeClass("fa-chevron-up");
  }
  curOpenIndex = index;
  curPro = 0;
  $(".question-item").eq(curOpenIndex).find(".card-body").removeClass("hidden");
  $(".question-item")
    .eq(curOpenIndex)
    .find(".card-head")
    .removeClass("not_select");
  $(".question-item")
    .eq(curOpenIndex)
    .find(".fa-chevron-down")
    .addClass("fa-chevron-up")
    .removeClass("fa-chevron-down");
  cleaTimerId = setInterval(function () {
    curPro += 0.8;
    $(".question-item")
      .eq(curOpenIndex)
      .find(".progress")
      .css("width", curPro + "%");
    if (curPro >= 100) {
      curPro = 0;
      $(".question-item").eq(curOpenIndex).find(".progress").css("width", "0%");
      $(".question-item")
        .eq(curOpenIndex)
        .find(".card-body")
        .addClass("hidden");
      $(".question-item")
        .eq(curOpenIndex)
        .find(".card-head")
        .addClass("not_select");
      $(".question-item")
        .eq(curOpenIndex)
        .find(".fa-chevron-up")
        .addClass("fa-chevron-down")
        .removeClass("fa-chevron-up");
      curOpenIndex++;
      curOpenIndex = curOpenIndex % questionCount;
      $(".question-item")
        .eq(curOpenIndex)
        .find(".card-body")
        .removeClass("hidden");
      $(".question-item")
        .eq(curOpenIndex)
        .find(".card-head")
        .removeClass("not_select");
      $(".question-item")
        .eq(curOpenIndex)
        .find(".fa-chevron-down")
        .addClass("fa-chevron-up")
        .removeClass("fa-chevron-down");
    }
  }, 40);
}

