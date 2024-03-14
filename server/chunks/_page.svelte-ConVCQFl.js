import { c as create_ssr_component, d as add_attribute, e as escape } from './ssr-BDbnMkiA.js';
import { Matrix } from 'ml-matrix';
import { Shape, Container, Text } from 'createjs-module';

const css = {
  code: "canvas.svelte-noqeui{position:fixed;left:0;top:0;background-color:rgb(255, 245, 234)}.errMsg.svelte-noqeui{font-family:'Playpen Sans', cursive;position:fixed;display:block;width:100vw;text-align:center;bottom:10px;left:0;font-size:30px}.header.svelte-noqeui{font-family:'Honk', system-ui;position:fixed;width:100vw;height:100px;top:0;left:0;font-size:45px;text-align:center;font-variation-settings:'MORF' 17,\n			'SHLN' 50}",
  map: null
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let canvas;
  new Shape();
  new Shape();
  new Container();
  new Text();
  new Matrix([[0], [0]]);
  let errMsg = "";
  $$result.css.add(css);
  return ` <canvas width="1000" height="1000" class="svelte-noqeui"${add_attribute("this", canvas, 0)}></canvas> ${`<div class="header svelte-noqeui" data-svelte-h="svelte-10tb08k"><h1>Can you draw a perfect circle?</h1></div>`} ${errMsg.length > 0 ? `<p class="errMsg svelte-noqeui">${escape(errMsg)}</p>` : ``} <div class="info"></div>`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-ConVCQFl.js.map
