import usePropuestaDraft from '../../hooks/usePropuestaDraft';

const PropuestaCartButton = () => {
  const { itemCount, openDrawer } = usePropuestaDraft();

  return (
    <button
      type="button"
      className="propuesta-cart-btn"
      onClick={openDrawer}
      aria-label="Ver propuesta en curso"
    >
      🧾
      {itemCount > 0 && <span className="propuesta-cart-btn__badge">{itemCount}</span>}
    </button>
  );
};

export default PropuestaCartButton;
