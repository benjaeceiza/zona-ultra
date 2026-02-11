

const Loader = ({ isVisible }) => {

  const containerClassName = isVisible ? "loader-container show" : "loader-container";

  return (
    <div className={containerClassName}>
      <div className="spinner"></div>
    </div>
  );
};

export default Loader;