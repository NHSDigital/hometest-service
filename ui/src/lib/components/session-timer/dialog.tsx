import { type Dialog } from '../../models/session-timer';
import utils from './utils';

function displayDialog($elementToDisplay: HTMLElement | string): Dialog {
  const $dialog = utils.generateDomElementFromString(
    '<div id="app-timeout-dialog" tabindex="-1" role="dialog" aria-modal="true" class="app-timeout-dialog">'
  ) as HTMLElement;
  const $overlay = utils.generateDomElementFromString(
    '<div id="app-timeout-overlay" class="app-timeout-overlay">'
  ) as HTMLElement;
  const $preparedElementToDisplay =
    typeof $elementToDisplay === 'string'
      ? utils.generateDomElementFromString($elementToDisplay)
      : $elementToDisplay;
  const resetElementsFunctionList: Array<() => void> = [];
  const closeCallbacks: Array<() => void> = [];

  if ($preparedElementToDisplay) {
    $dialog.appendChild($preparedElementToDisplay as Node);
  }

  if (!utils.hasClass('body', 'app-no-scroll')) {
    utils.addClass('body', 'app-no-scroll');
    resetElementsFunctionList.push(() => {
      utils.removeClass('body', 'app-no-scroll');
    });
  }

  document.body.appendChild($dialog);
  document.body.appendChild($overlay);

  resetElementsFunctionList.push(() => {
    utils.removeElement($dialog);
    utils.removeElement($overlay);
  });

  const setupFocusHandlerAndFocusDialog = () => {
    function keepFocus(event: FocusEvent) {
      const modalFocus = document.getElementById('app-timeout-dialog');
      if (
        modalFocus &&
        event.target !== modalFocus &&
        !modalFocus.contains(event.target as Node)
      ) {
        event.stopPropagation();
        modalFocus.focus();
      }
    }

    const elemToFocusOnReset = document.activeElement as HTMLElement;
    $dialog.focus();

    document.addEventListener('focus', keepFocus, true);

    resetElementsFunctionList.push(() => {
      document.removeEventListener('focus', keepFocus);
      elemToFocusOnReset.focus();
    });
  };

  // to disable the non-dialog page to prevent confusion for VoiceOver users
  const selectors = ['body > .nhsuk-skip-link', '#root'];
  const elements = document.querySelectorAll(selectors.join(', '));

  const close = () => {
    while (resetElementsFunctionList.length > 0) {
      const resetElements = resetElementsFunctionList.shift();
      if (resetElements) resetElements();
    }
  };

  const closeAndInform = () => {
    closeCallbacks.forEach((fn) => {
      fn();
    });
    close();
  };

  const setupKeydownHandler = () => {
    function keydownListener(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        closeAndInform();
      }
    }

    document.addEventListener('keydown', keydownListener);

    resetElementsFunctionList.push(() => {
      document.removeEventListener('keydown', keydownListener);
    });
  };

  const preventMobileScrollWhileAllowingPinchZoom = () => {
    const handleTouch = (e: TouchEvent) => {
      const touches = e.touches || e.changedTouches || [];

      if (touches.length === 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', handleTouch, true);

    resetElementsFunctionList.push(() => {
      document.removeEventListener('touchmove', handleTouch, true);
    });
  };

  elements.forEach(($elem) => {
    const value = $elem.getAttribute('aria-hidden');
    $elem.setAttribute('aria-hidden', 'true');
    resetElementsFunctionList.push(() => {
      if (value) {
        $elem.setAttribute('aria-hidden', value);
      } else {
        $elem.removeAttribute('aria-hidden');
      }
    });
  });

  setupFocusHandlerAndFocusDialog();
  setupKeydownHandler();
  preventMobileScrollWhileAllowingPinchZoom();

  return {
    closeDialog() {
      close();
    },
    setAriaLabelledBy(value: string) {
      if (value) {
        $dialog.setAttribute('aria-labelledby', value);
      } else {
        $dialog.removeAttribute('aria-labelledby');
      }
    },
    addCloseHandler(closeHandler: () => void) {
      closeCallbacks.push(closeHandler);
    }
  };
}

const dialog = { displayDialog };

export default dialog;
