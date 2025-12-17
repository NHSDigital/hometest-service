jest.mock('react-dom/client', () => ({
  createRoot: jest.fn()
}));
jest.mock('../js/setClassName', () => ({
  setBodyClassName: jest.fn()
}));

describe('When index.tsx is imported', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    jest.resetModules();
  });

  it('should call createRoot, render and setBodyClassName', () => {
    const createRoot = require('react-dom/client').createRoot as jest.Mock;
    const renderMock = jest.fn();
    createRoot.mockReturnValue({ render: renderMock });

    const setBodyClassName = require('../js/setClassName')
      .setBodyClassName as jest.Mock;

    require('../index.tsx');

    expect(createRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(renderMock).toHaveBeenCalled();
    expect(setBodyClassName).toHaveBeenCalled();
  });
});
