const Loading = () => {
  return (
    <div className="absolute inset-0 flex justify-center items-center">
      <div className="loader-container">
        <div className="loader-dot"></div>
        <div className="loader-dot"></div>
        <div className="loader-dot"></div>
        <div className="loader-dot"></div>
      </div>
    </div>
  );
};
export default Loading;
