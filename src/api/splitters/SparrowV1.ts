import type { Rect, SplitterRect } from 'api/types';
import Splitter from './Splitter';

import { Parser as XmlParser } from 'xml2js';
import { HaxeXmlParser } from './tools/HaxeXmlParser';

type SparrowFrame = {
	x: number,
	y: number,
	name: string,
	w: number,
	h: number
}

type RawSparrowFrame = {
	x: string,
	y: string,
	name: string,
	w: string,
	h: string
}

class SparrowV1 extends Splitter {
	override doCheck(data: string, cb: (checked: boolean) => void) {
		if(!data) {
			cb(false);
			return;
		}

		try {
			var parser = new XmlParser();
			parser.parseString(data, (err, atlas) => {
				if(err) {
					throw err;
				}

				cb(atlas.TextureAtlas && Array.isArray(atlas.TextureAtlas.SubTexture));
			});
		}
		catch(e) {
			try {
				const atlas = HaxeXmlParser.parse(data, false);
				if(atlas.hasElement("TextureAtlas")) {
					const list = atlas.firstElement();
					const arr = list.elementsNamed("SubTexture");
					cb(arr.length > 0);
				} else {
					cb(false);
				}
			} catch(e) {
				console.error(e);
				cb(false);
			}
		}
	}

	override doSplit(data: string, cb: (res: Rect[] | false) => void) {
		if(!data) {
			cb(false);
			return;
		}

		let res: SplitterRect[] = [];

		try {
			var parser = new XmlParser();
			parser.parseString(data, (err, atlas) => {
				if(err) {
					throw err;
				}

				let list = atlas.TextureAtlas.SubTexture;

				for(let li of list) {
					let attribs = li.$;

					res.push(this.convertToRect({
						name: attribs.name,
						x: attribs.x,
						y: attribs.y,
						w: attribs.w,
						h: attribs.h
					}));
				}

				cb(res);
			});
		}
		catch(e) {
			try {
				const atlas = HaxeXmlParser.parse(data, false).firstElement();
				const rects = atlas.elementsNamed("SubTexture");
				for(const rect of rects) {
					res.push(this.convertToRect({
						name: rect.get("name"),
						x: rect.get("x"),
						y: rect.get("y"),
						w: rect.get("width"),
						h: rect.get("height")
					}));
				}
				cb(res);
				return;
			} catch(e) {
				console.error(e);
			}
		}

		cb(res);
	}

	private convertToRect(attribs:RawSparrowFrame): Rect {
		const name = Splitter.fixFileName(attribs.name);


		const width = parseInt(attribs.w, 10);
		const height = parseInt(attribs.h, 10);

		const item: SparrowFrame = {
			name: name,
			x: parseInt(attribs.x, 10),
			y: parseInt(attribs.y, 10),
			w: width,
			h: height
		};

		return {
			name: item.name,
			frame: {
				x: item.x,
				y: item.y,
				w: item.w,
				h: item.h
			},
			spriteSourceSize: {
				x: 0,
				y: 0,
				w: item.w,
				h: item.h
			},
			sourceSize: {
				w: item.w,
				h: item.h
			},
			frameSize: {
				x: 0,
				y: 0,
				w: item.w,
				h: item.h
			},
			rotated: false,
			trimmed: false
		};
	}

	override get splitterName() {
		return 'Sparrow V1';
	}
}

export default SparrowV1;