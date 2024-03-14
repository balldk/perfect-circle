const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "perfect-circle/_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {"start":"_app/immutable/entry/start.C1G9g37k.js","app":"_app/immutable/entry/app.CHH3wlla.js","imports":["_app/immutable/entry/start.C1G9g37k.js","_app/immutable/chunks/entry.Bn8c4wOe.js","_app/immutable/chunks/scheduler.BvLojk_z.js","_app/immutable/entry/app.CHH3wlla.js","_app/immutable/chunks/scheduler.BvLojk_z.js","_app/immutable/chunks/index.DXL13Q8W.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./chunks/0-DQE02fm3.js')),
			__memo(() => import('./chunks/1-CT30xXW-.js')),
			__memo(() => import('./chunks/2-IJSh1lmN.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

const base = "/perfect-circle";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
