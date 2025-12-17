const { warn } = console;

const utils = {
  generateDomElementFromString(str: string): ChildNode | null {
    const abc = document.createElement('div');
    abc.innerHTML = str;
    return abc.firstChild;
  },

  generateDomElementFromStringAndAppendText(
    str: string,
    text: string
  ): HTMLElement {
    const $tmp = utils.generateDomElementFromString(str) as HTMLElement;
    if ($tmp) {
      $tmp.innerText = text;
    }
    return $tmp;
  },

  hasClass(selector: string, className: string): boolean {
    const element = document.querySelector(selector);
    return element ? element.classList.contains(className) : false;
  },

  addClass(selector: string, className: string): void {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      element.classList.add(className);
    });
  },

  removeClass(selector: string, className: string): void {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      element.classList.remove(className);
    });
  },

  removeElement($elem: HTMLElement): void {
    const parent = $elem.parentNode;
    if (parent) {
      parent.removeChild($elem);
    } else {
      warn("Couldn't find parent for elem", $elem);
    }
  }
};

export default utils;
