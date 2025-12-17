export function setBodyClassName() {
  document.body.className = document.body.className
    ? document.body.className + ' js-enabled'
    : 'js-enabled';
}
