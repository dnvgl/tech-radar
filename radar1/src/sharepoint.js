function isInSharepointDesignMode() {
  return window.MSOWebPartPageFormName && document.forms[MSOWebPartPageFormName].MSOLayout_InDesignMode.value == 1;
}

function isIE() {
  var ua = window.navigator.userAgent;
  var msie = ua.indexOf("MSIE ");
  return msie > 0;
}