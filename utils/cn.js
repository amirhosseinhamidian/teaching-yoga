const cn = (...classes) => {
  return classes.flat(Infinity).filter(Boolean).join(' ').trim();
};

export default cn;
