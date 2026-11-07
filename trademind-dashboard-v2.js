}
    el("tm-calendar").innerHTML = html;
  }

  el("tm-prev").onclick = () => {
    month.setMonth(month.getMonth()-1);
    updateCalendar();
  };
  el("tm-next").onclick = () => {
    month.setMonth(month.getMonth()+1);
    updateCalendar();
  };

  const oldRender = render;
  render = function(...args) {
    oldRender.apply(this,args);
    updateDashboard();
  };

  updateDashboard();
})();
