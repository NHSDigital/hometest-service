import { setBodyClassName } from '../../../src/js/setClassName';

describe('When setBodyClassName is called', () => {
  beforeEach(() => {
    document.body.className = '';
  });

  it('should add js-enabled when no class exists', () => {
    setBodyClassName();
    expect(document.body.className).toBe('js-enabled');
  });

  it('should append js-enabled when a class already exists', () => {
    document.body.className = 'existing';
    setBodyClassName();
    expect(document.body.className).toBe('existing js-enabled');
  });
});
