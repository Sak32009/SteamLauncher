const mustacheObjsWithKeys = (pp: Record<string, unknown>) => {
  const rr = [];
  for (const kk in pp) {
    if (Object.prototype.hasOwnProperty.call(pp, kk)) {
      rr.push({
        '@key': kk,
        '@val': pp[kk],
      });
    }
  }

  return rr;
};

export default mustacheObjsWithKeys;