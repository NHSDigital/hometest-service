import utils from './utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateDialogHTML(timeoutDialogParams: any) {
  const $element = utils.generateDomElementFromString('<div>');

  if (timeoutDialogParams.title) {
    const $tmp = utils.generateDomElementFromStringAndAppendText(
      '<h1 id="app-timeout-dialog__heading" class="app-timeout-dialog__heading nhsuk-heading-m">',

      timeoutDialogParams.title
    );
    $element?.appendChild($tmp);
  }

  const $countdownElement = utils.generateDomElementFromString(
    '<span id="app-timeout-dialog__countdown" class="app-timeout-dialog__countdown">'
  ) as HTMLElement | null;

  const $audibleMessage = utils.generateDomElementFromString(
    '<p id="app-timeout-message" class="nhsuk-u-visually-hidden" aria-live="assertive">'
  ) as HTMLElement | null;

  const $visualMessage = utils.generateDomElementFromStringAndAppendText(
    '<p class="nhsuk-body app-timeout-dialog__message" aria-hidden="true">',

    timeoutDialogParams.message ?? ''
  );

  if ($visualMessage) {
    $visualMessage.appendChild(document.createTextNode(' '));
    if ($countdownElement) {
      $visualMessage.appendChild($countdownElement);
    }
    $visualMessage.appendChild(document.createTextNode('.'));
    if (timeoutDialogParams.messageSuffix) {
      $visualMessage.appendChild(
        document.createTextNode(` ${timeoutDialogParams.messageSuffix}`)
      );
    }
  }

  const $staySignedInButton = utils.generateDomElementFromStringAndAppendText(
    '<button id="app-timeout-keep-signin-btn" class="nhsuk-button app-button--full-width app-timeout-dialog__keep-signin-button">',

    timeoutDialogParams.keepAliveButtonText ?? ''
  );

  // Create anchor element
  const $signOutAnchor = utils.generateDomElementFromStringAndAppendText(
    '<a id="app-timeout-sign-out-link" class="nhsuk-link app-timeout-dialog__link"></a>',

    timeoutDialogParams.signOutButtonText ?? ''
  );

  // Create the paragraph element
  const $signOutButton = utils.generateDomElementFromStringAndAppendText(
    '<p class="nhsuk-body"></p>',
    ''
  );

  // Nest anchor inside paragraph
  $signOutButton.appendChild($signOutAnchor);

  const $buttonGroup = utils.generateDomElementFromString(
    '<div class="app-timeout-dialog__button-group"></div>'
  ) as HTMLElement | null;

  if ($buttonGroup) {
    $buttonGroup.appendChild($staySignedInButton);
    $buttonGroup.appendChild(wrapLink($signOutButton));
  }

  $element?.appendChild($visualMessage);
  if ($audibleMessage) {
    $element?.appendChild($audibleMessage);
  }
  if ($buttonGroup) {
    $element?.appendChild($buttonGroup);
  }

  return {
    $element,
    $staySignedInButton,
    $signOutAnchor,
    $countdownElement,
    $audibleMessage
  };

  function wrapLink($elem: HTMLElement): HTMLElement {
    const $wrapper = document.createElement('div');
    $wrapper.classList.add('app-timeout-dialog__link-wrapper');
    $wrapper.appendChild($elem);

    return $wrapper;
  }
}
