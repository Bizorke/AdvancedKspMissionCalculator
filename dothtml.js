"use strict";
/*
	This is an experimental project created by Joshua Sideris. 
	It has not been released to public yet and you do not have permission to use or distribute it.
	Instead, follow me on Twitter to be notified of an official release.
*/


function DOT (){
	this._es = [];
	this._ce = null;
	this._myDom = null;
	this._newBlock = false;
	this._lastCondition = true;
	
	this.do = function(newtarget){
		if(typeof newtarget !== "undefined"){
			this._es = [$(newtarget)];
			this._ce = newtarget;
		}
		else{
			this._es.push(this._ce);
			this._ce = null;
		}
		return DOT;
	}
	
	this.end = function(){
		this._newBlock = false;
		if(this._es.length > 1){
			this._ce = this._es.pop();
		}
		return DOT;
	}
	
	this.attr = function(a, v){
		this._ce.attr(a, v);
		return DOT;
	}
	
	this.el = function(e, c){
		/*if(arguments.length == 2){
			if(typeof a === "string"){
				c = a;
				a = undefined;
			}
		}*/
		this._ce = $("<" + e + "/>");
		if(!typeof c !== "undefined"){
			this._ce.html(c);
		}
		this._es[this._es.length - 1].append(this._ce);
		
		return DOT;
	}
	
	this.iterate = function(iterations, callback, params){
		for(var i = 0; i < iterations; i++){
			callback(i, params);
		}
		
		return DOT;
	}
	
	this.each = function(objects, callback){
		for(var i = 0; i < objects.length; i++){
			callback(objects[i]);
		}
		return DOT;
	}
	
	this.if = function(condition, callback){
		if(condition) {
			callback();
			this._lastCondition = true;
		}
		else{
			this._lastCondition = false;
		}
		return DOT;
	}
	
	this.elseif = function(condition, callback){
		if(!this._lastCondition){
			this.if(condition, callback);
		}
		return DOT;
	}
	
	this.else = function(callback){
		if(!this._lastCondition){
			callback();
		}
		return DOT;
	}
	
	this.script = function(callback){
		callback();
		return DOT;
	}
	
	this.t = function(c){
		this._ce = null;
		this._es[this._es.length - 1].append($("<div/>").text(c).html());
		return DOT;
	}
	
	this.h = function(c){
		this._ce = null;
		this._es[this._es.length - 1].append(c);
		return DOT;
	}
	
	this.a = function(c){return this.el("a", c);}
	this.abbr = function(c){return this.el("abbr", c);}
	this.address = function(c){return this.el("address", c);}
	this.area = function(c){return this.el("area", c);}
	this.article = function(c){return this.el("article", c);}
	this.aaside = function(c){return this.el("aside", c);}
	this.audio = function(c){return this.el("audio", c);}
	this.b = function(c){return this.el("b", c);}
	this.bdi = function(c){return this.el("bdi", c);}
	this.bdo = function(c){return this.el("bdo", c);}
	this.blockquote = function(c){return this.el("blockquote", c);}
	this.br = function(c){return this.el("br", c);}
	this.button = function(c){return this.el("button", c);}
	this.canvas = function(c){return this.el("canvas", c);}
	this.caption = function(c){return this.el("caption", c);}
	this.code = function(c){return this.el("code", c);}
	this.col = function(c){return this.el("col", c);}
	this.colgroup = function(c){return this.el("colgroup", c);}
	this.datalist = function(c){return this.el("datalist", c);}
	this.dd = function(c){return this.el("dd", c);}
	this.del = function(c){return this.el("del", c);}
	this.details = function(c){return this.el("details", c);}
	this.dfn = function(c){return this.el("dfn", c);}
	this.dialog = function(c){return this.el("dialog", c);}
	this.div = function(c){return this.el("div", c);}
	this.dl = function(c){return this.el("dl", c);}
	this.dt = function(c){return this.el("dt", c);}
	this.em = function(c){return this.el("em", c);}
	this.embed = function(c){return this.el("embed", c);}
	this.fieldset = function(c){return this.el("fieldset", c);}
	this.figcaption = function(c){return this.el("figcaption", c);}
	this.figure = function(c){return this.el("figure", c);}
	this.footer = function(c){return this.el("footer", c);}
	this.h1 = function(c){return this.el("h1", c);}
	this.h2 = function(c){return this.el("h2", c);}
	this.h3 = function(c){return this.el("h3", c);}
	this.h4 = function(c){return this.el("h4", c);}
	this.h5 = function(c){return this.el("h5", c);}
	this.h6 = function(c){return this.el("h6", c);}
	this.header = function(c){return this.el("header", c);}
	this.hr = function(c){return this.el("hr", c);}
	this.i = function(c){return this.el("i", c);}
	this.iframe = function(c){return this.el("iframe", c);}
	this.img = function(c){return this.el("img", c);}
	this.input = function(c){return this.el("input", c);}
	this.ins = function(c){return this.el("ins", c);}
	this.kbd = function(c){return this.el("kbd", c);}
	this.keygen = function(c){return this.el("keygen", c);}
	this.legend = function(c){return this.el("legend", c);}
	this.li = function(c){return this.el("li", c);}
	this.main = function(c){return this.el("main", c);}
	this.map = function(c){return this.el("map", c);}
	this.mark = function(c){return this.el("mark", c);}
	this.menu = function(c){return this.el("menu", c);}
	this.menuitem = function(c){return this.el("menuitem", c);}
	this.meter = function(c){return this.el("meter", c);}
	this.nav = function(c){return this.el("nav", c);}
	this.noscript = function(c){return this.el("noscript", c);}
	this.object = function(c){return this.el("object", c);}
	this.ol = function(c){return this.el("ol", c);}
	this.optgroup = function(c){return this.el("optgroup", c);}
	this.option = function(c){return this.el("option", c);}
	this.output = function(c){return this.el("output", c);}
	this.p = function(c){return this.el("p", c);}
	this.param = function(c){return this.el("param", c);}
	this.pre = function(c){return this.el("pre", c);}
	this.progress = function(c){return this.el("progress", c);}
	this.q = function(c){return this.el("q", c);}
	this.rp = function(c){return this.el("rp", c);}
	this.rt = function(c){return this.el("rt", c);}
	this.ruby = function(c){return this.el("ruby", c);}
	this.s = function(c){return this.el("s", c);}
	this.samp = function(c){return this.el("samp", c);}
	this.section = function(c){return this.el("section", c);}
	this.select = function(c){return this.el("select", c);}
	this.small = function(c){return this.el("small", c);}
	this.source = function(c){return this.el("source", c);}
	this.strong = function(c){return this.el("strong", c);}
	this.sub = function(c){return this.el("sub", c);}
	this.sup = function(c){return this.el("sup", c);}
	this.table = function(c){return this.el("table", c);}
	this.tbody = function(c){return this.el("tbody", c);}
	this.td = function(c){return this.el("td", c);}
	this.textarea = function(c){return this.el("textarea", c);}
	this.tfoot = function(c){return this.el("tfoot", c);}
	this.th = function(c){return this.el("th", c);}
	this.thead = function(c){return this.el("thead", c);}
	this.time = function(c){return this.el("time", c);}
	this.tr = function(c){return this.el("tr", c);}
	this.track = function(c){return this.el("track", c);}
	this.u = function(c){return this.el("u", c);}
	this.ul = function(c){return this.el("ul", c);}
	this.var = function(c){return this.el("var", c);}
	this.video = function(c){return this.el("video", c);}
	this.wbr = function(c){return this.el("wbr", c);}
	
	this.accept = function(value){return this.attr("accept", value);}
	this.acceptcharset = function(value){return this.attr("accept-charset", value);}
	this.accesskey = function(value){return this.attr("accesskey", value);}
	this.action = function(value){return this.attr("action", value);}
	this.align = function(value){return this.attr("align", value);}
	this.alink = function(value){return this.attr("alink", value);}
	this.alt = function(value){return this.attr("alt", value);}
	this.archive = function(value){return this.attr("archive", value);}
	this.async = function(value){return this.attr("async", value);}
	this.autocomplete = function(value){return this.attr("autocomplete", value);}
	this.autofocus = function(value){return this.attr("autofocus", value);}
	this.autoplay = function(value){return this.attr("autoplay", value);}
	this.autosave = function(value){return this.attr("autosave", value);}
	this.axis = function(value){return this.attr("axis", value);}
	this.background = function(value){return this.attr("background", value);}
	this.bgcolor = function(value){return this.attr("bgcolor", value);}
	this.border = function(value){return this.attr("border", value);}
	this.buffered = function(value){return this.attr("buffered", value);}
	this.cellpadding = function(value){return this.attr("cellpadding", value);}
	this.cellspacing = function(value){return this.attr("cellspacing", value);}
	this.challenge = function(value){return this.attr("challenge", value);}
	this.char = function(value){return this.attr("char", value);}
	this.charoff = function(value){return this.attr("charoff", value);}
	this.charset = function(value){return this.attr("charset", value);}
	this.checked = function(value){return this.attr("checked", value);}
	this.class = function(value){return this.attr("class", value);}
	this.classid = function(value){return this.attr("classid", value);}
	this.clear = function(value){return this.attr("clear", value);}
	this.codebase = function(value){return this.attr("codebase", value);}
	this.codetype = function(value){return this.attr("codetype", value);}
	this.color = function(value){return this.attr("color", value);}
	this.cols = function(value){return this.attr("cols", value);}
	this.colspan = function(value){return this.attr("colspan", value);}
	this.compact = function(value){return this.attr("compact", value);}
	this.content = function(value){return this.attr("content", value);}
	this.contenteditable = function(value){return this.attr("contenteditable", value);}
	this.contextmenu = function(value){return this.attr("contextmenu", value);}
	this.controls = function(value){return this.attr("controls", value);}
	this.coords = function(value){return this.attr("coords", value);}
	this.datetime = function(value){return this.attr("datetime", value);}
	this.declare = function(value){return this.attr("declare", value);}
	this.default = function(value){return this.attr("default", value);}
	this.defer = function(value){return this.attr("defer", value);}
	this.dir = function(value){return this.attr("dir", value);}
	this.dirname = function(value){return this.attr("dirname", value);}
	this.disabled = function(value){return this.attr("disabled", value);}
	this.download = function(value){return this.attr("download", value);}
	this.draggable = function(value){return this.attr("draggable", value);}
	this.dropzone = function(value){return this.attr("dropzone", value);}
	this.enctype = function(value){return this.attr("enctype", value);}
	this.face = function(value){return this.attr("face", value);}
	this.for = function(value){return this.attr("for", value);}
	this.formaction = function(value){return this.attr("formaction", value);}
	this.frame = function(value){return this.attr("frame", value);}
	this.frameborder = function(value){return this.attr("frameborder", value);}
	this.headers = function(value){return this.attr("headers", value);}
	this.height = function(value){return this.attr("height", value);}
	this.hidden = function(value){return this.attr("hidden", value);}
	this.high = function(value){return this.attr("high", value);}
	this.href = function(value){return this.attr("href", value);}
	this.hreflang = function(value){return this.attr("hreflang", value);}
	this.hspace = function(value){return this.attr("hspace", value);}
	this.httpequiv = function(value){return this.attr("http-equiv", value);}
	this.icon = function(value){return this.attr("icon", value);}
	this.id = function(value){return this.attr("id", value);}
	this.ismap = function(value){return this.attr("ismap", value);}
	this.itemprop = function(value){return this.attr("itemprop", value);}
	this.keytype = function(value){return this.attr("keytype", value);}
	this.kind = function(value){return this.attr("kind", value);}
	this.lang = function(value){return this.attr("lang", value);}
	this.language = function(value){return this.attr("language", value);}
	this.link = function(value){return this.attr("link", value);}
	this.list = function(value){return this.attr("list", value);}
	this.longdesc = function(value){return this.attr("longdesc", value);}
	this.loop = function(value){return this.attr("loop", value);}
	this.low = function(value){return this.attr("low", value);}
	this.manifest = function(value){return this.attr("manifest", value);}
	this.marginheight = function(value){return this.attr("marginheight", value);}
	this.marginwidth = function(value){return this.attr("marginwidth", value);}
	this.max = function(value){return this.attr("max", value);}
	this.maxlength = function(value){return this.attr("maxlength", value);}
	this.media = function(value){return this.attr("media", value);}
	this.method = function(value){return this.attr("method", value);}
	this.min = function(value){return this.attr("min", value);}
	this.multiple = function(value){return this.attr("multiple", value);}
	this.muted = function(value){return this.attr("muted", value);}
	this.name = function(value){return this.attr("name", value);}
	this.nohref = function(value){return this.attr("nohref", value);}
	this.noresize = function(value){return this.attr("noresize", value);}
	this.noshade = function(value){return this.attr("noshade", value);}
	this.novalidate = function(value){return this.attr("novalidate", value);}
	this.nowrap = function(value){return this.attr("nowrap", value);}
	this.onblur = function(value){return this.attr("onblur", value);}
	this.onchange = function(value){return this.attr("onchange", value);}
	this.onclick = function(value){return this.attr("onclick", value);}
	this.ondblclick = function(value){return this.attr("ondblclick", value);}
	this.onfocus = function(value){return this.attr("onfocus", value);}
	this.onkeydown = function(value){return this.attr("onkeydown", value);}
	this.onkeypress = function(value){return this.attr("onkeypress", value);}
	this.onkeyup = function(value){return this.attr("onkeyup", value);}
	this.onload = function(value){return this.attr("onload", value);}
	this.onmousedown = function(value){return this.attr("onmousedown", value);}
	this.onmousemove = function(value){return this.attr("onmousemove", value);}
	this.onmouseout = function(value){return this.attr("onmouseout", value);}
	this.onmouseover = function(value){return this.attr("onmouseover", value);}
	this.onmouseup = function(value){return this.attr("onmouseup", value);}
	this.onreset = function(value){return this.attr("onreset", value);}
	this.onselect = function(value){return this.attr("onselect", value);}
	this.onsubmit = function(value){return this.attr("onsubmit", value);}
	this.onunload = function(value){return this.attr("onunload", value);}
	this.open = function(value){return this.attr("open", value);}
	this.optimum = function(value){return this.attr("optimum", value);}
	this.pattern = function(value){return this.attr("pattern", value);}
	this.ping = function(value){return this.attr("ping", value);}
	this.placeholder = function(value){return this.attr("placeholder", value);}
	this.poster = function(value){return this.attr("poster", value);}
	this.preload = function(value){return this.attr("preload", value);}
	this.profile = function(value){return this.attr("profile", value);}
	this.prompt = function(value){return this.attr("prompt", value);}
	this.radiogroup = function(value){return this.attr("radiogroup", value);}
	this.readonly = function(value){return this.attr("readonly", value);}
	this.rel = function(value){return this.attr("rel", value);}
	this.required = function(value){return this.attr("required", value);}
	this.rev = function(value){return this.attr("rev", value);}
	this.reversed = function(value){return this.attr("reversed", value);}
	this.rows = function(value){return this.attr("rows", value);}
	this.rowspan = function(value){return this.attr("rowspan", value);}
	this.rules = function(value){return this.attr("rules", value);}
	this.sandbox = function(value){return this.attr("sandbox", value);}
	this.scheme = function(value){return this.attr("scheme", value);}
	this.scope = function(value){return this.attr("scope", value);}
	this.scoped = function(value){return this.attr("scoped", value);}
	this.scrolling = function(value){return this.attr("scrolling", value);}
	this.seamless = function(value){return this.attr("seamless", value);}
	this.selected = function(value){return this.attr("selected", value);}
	this.shape = function(value){return this.attr("shape", value);}
	this.size = function(value){return this.attr("size", value);}
	this.sizes = function(value){return this.attr("sizes", value);}
	this.spellcheck = function(value){return this.attr("spellcheck", value);}
	this.src = function(value){return this.attr("src", value);}
	this.srcdoc = function(value){return this.attr("srcdoc", value);}
	this.srclang = function(value){return this.attr("srclang", value);}
	this.srcset = function(value){return this.attr("srcset", value);}
	this.standby = function(value){return this.attr("standby", value);}
	this.start = function(value){return this.attr("start", value);}
	this.step = function(value){return this.attr("step", value);}
	this.style = function(value){return this.attr("style", value);}
	this.tabindex = function(value){return this.attr("tabindex", value);}
	this.target = function(value){return this.attr("target", value);}
	this.text = function(value){return this.attr("text", value);}
	this.title = function(value){return this.attr("title", value);}
	this.type = function(value){return this.attr("type", value);}
	this.usemap = function(value){return this.attr("usemap", value);}
	this.valign = function(value){return this.attr("valign", value);}
	this.value = function(value){return this.attr("value", value);}
	this.valuetype = function(value){return this.attr("valuetype", value);}
	this.version = function(value){return this.attr("version", value);}
	this.vlink = function(value){return this.attr("vlink", value);}
	this.vspace = function(value){return this.attr("vspace", value);}
	this.width = function(value){return this.attr("width", value);}
	this.wrap = function(value){return this.attr("wrap", value);}

	//Data is a special attribute.
	this.data = function(suffix, value){
		if(arguments.length < 2){
			value = suffix;
			suffix = undefined;
			return this.attr("data", value);
		}
		else{
			return this.attr("data-" + suffix, value);
		}
	}
	
	//Special handling for names that exist as both elements and attributes.
	//summary, span, label, form, cite
	
	this.cite = function(arg){
		var tagType = null;
		if(this._ce != null)
			tagType = this._ce[0].nodeName.toLowerCase();
		if(tagType != null && typeof arg !== "undefined" 
			&& (tagType == "blockquote" 
			|| tagType == "del" 
			|| tagType == "ins" 
			|| tagType == "q"))
			return this.attr("cite", arg);
		else
			return this.el("cite", arg);
	}
	
	this.form = function(arg){
		var tagType = null;
		if(this._ce != null)
			tagType = this._ce[0].nodeName.toLowerCase();
		if(tagType != null && typeof arg !== "undefined" 
			&& (tagType == "button" 
			|| tagType == "fieldset" 
			|| tagType == "input" 
			|| tagType == "keygen" 
			|| tagType == "label" 
			|| tagType == "meter" 
			|| tagType == "object" 
			|| tagType == "output" 
			|| tagType == "progress" 
			|| tagType == "select" 
			|| tagType == "textarea" 
			))
				return this.attr("cite", arg);
		else
			return this.el("cite", arg);
	}
	
	this.label = function(arg){
		var tagType = null;
		if(this._ce != null)
			tagType = this._ce[0].nodeName.toLowerCase();
		if(tagType != null && typeof arg !== "undefined" 
			&& (tagType == "track"))
			return this.attr("label", arg);
		else
			return this.el("label", arg);
	}
	
	this.span = function(arg){
		var tagType = null;
		if(this._ce != null)
			tagType = this._ce[0].nodeName.toLowerCase();
		if(tagType != null && typeof arg !== "undefined" 
			&& (tagType == "select" 
			|| tagType == "input"))
			return this.attr("span", arg);
		else
			return this.el("span", arg);
	}
	
		this.summary = function(arg){
		var tagType = null;
		if(this._ce != null)
			tagType = this._ce[0].nodeName.toLowerCase();
		if(tagType != null && typeof arg !== "undefined" 
			&& (tagType == "table"))
			return this.attr("summary", arg);
		else
			return this.el("summary", arg);	
	}
	
	//Jquery event wrappers
	this.$blur = function(handler){$(this._ce).blur(handler); return DOT;}
	this.$change = function(handler){$(this._ce).change(handler); return DOT;}
	this.$click = function(handler){$(this._ce).click(handler); return DOT;}
	this.$dblclick = function(handler){$(this._ce).dblclick(handler); return DOT;}
	this.$focus = function(handler){$(this._ce).focus(handler); return DOT;}
	this.$focusin = function(handler){$(this._ce).focusin(handler); return DOT;}
	this.$focusout = function(handler){$(this._ce).focusout(handler); return DOT;}
	this.$hover = function(inHandler, outHandler){$(this._ce).hover(inHandler, outHandler); return DOT;}
	this.$keydown = function(handler){$(this._ce).keydown(handler); return DOT;}
	this.$keypress = function(handler){$(this._ce).keypress(handler); return DOT;}
	this.$keyup = function(handler){$(this._ce).keyup(handler); return DOT;}
	this.$mousedown = function(handler){$(this._ce).mousedown(handler); return DOT;}
	this.$mouseenter = function(handler){$(this._ce).mouseenter(handler); return DOT;}
	this.$mouseleave = function(handler){$(this._ce).mouseleave(handler); return DOT;}
	this.$mousemove = function(handler){$(this._ce).mousemove(handler); return DOT;}
	this.$mouseout = function(handler){$(this._ce).mouseout(handler); return DOT;}
	this.$mouseover = function(handler){$(this._ce).mouseover(handler); return DOT;}
	this.$mouseup = function(handler){$(this._ce).mouseup(handler); return DOT;}
	this.$on = function(event, childSelector, data, handler, map){$(this._ce).on(event, childSelector, data, handler, map); return DOT;}
	this.$one = function(event, data, handler){$(this._ce).one(event, data, handler); return DOT;}
	this.$resize = function(handler){$(this._ce).resize(handler); return DOT;}
	this.$scroll = function(handler){$(this._ce).scroll(handler); return DOT;}
	this.$select = function(handler){$(this._ce).select(handler); return DOT;}
	this.$submit = function(handler){$(this._ce).submit(handler); return DOT;}
	
	this.$animate = function(p1, p2, p3, p4){$(this._ce).animate(p1, p2, p3, p4); return DOT;}
	this.$css = function(p1, p2){$(this._ce).css(p1, p2); return DOT;}
	this.$empty = function(){$(this._ce).empty(); return DOT;}
	this.$fadeIn = function(p1, p2){$(this._ce).fadeIn(p1, p2); return DOT;}
	this.$fadeOut = function(p1, p2){$(this._ce).fadeIn(p1, p2); return DOT;}
	this.$fadeTo = function(p1, p2, p3, p4){$(this._ce).fadeTo(p1, p2, p3, p4); return DOT;}
	this.$hide = function(p1, p2, p3){$(this._ce).hide(p1, p2, p3); return DOT;}
	this.$show = function(p1, p2, p3){$(this._ce).show(p1, p2, p3); return DOT;}

}

var DOT = new DOT();
