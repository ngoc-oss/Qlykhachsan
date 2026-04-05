function LoadingSpinner({ size = "md", text = "Đang tải..." }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div
        className={`${sizeClasses[size]} border-blue-200 border-t-blue-600 rounded-full animate-spin`}
      ></div>
      {text && <p className="text-sm text-slate-600 animate-pulse">{text}</p>}
    </div>
  );
}

export default LoadingSpinner;
