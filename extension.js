import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Meta from 'gi://Meta';
import St from 'gi://St';
import Shell from 'gi://Shell';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

const SHORTCUT = 'grayscale-window-shortcut';
const GLOBAL_SHORTCUT = 'grayscale-global-shortcut';

export const GrayscaleEffect = GObject.registerClass(
class DesaturateEffect extends Clutter.DesaturateEffect {
    constructor() {
		super();
        this.factor = 1.0;
    }
});



// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// The purpose of this function is to apply grayscale effect 
// to various 'actor' objects in the GNOME Shell.
// 1. Children within the `Main.uiGroup` object.
//    - a) Children within the `Meta.WindowGroup` object.
//         The `Meta.WindowGroup` object is the background.
//         This includes the wallpaper and desktop icon
// 2. The `global.get_window_actors()` object.
//    - This object contains all the application windows currently open.
//       - i.e. browser windows, terminal, VSCode, etc.
function applyGrayscale() {
	// Set background grey
	Main.uiGroup.get_children().forEach(actor => {
		let effect = new GrayscaleEffect();
		//actor.add_effect_with_name('grayscale-color', effect);
		
		if (actor instanceof Meta.WindowGroup) {
			actor.get_children().forEach(child => {
				if(!actor.get_effect('grayscale-color')) {
					child.add_effect_with_name('grayscale-color', effect);
				}
			});
		}
		// if (actor instanceof St.Widget || actor instanceof St.BoxLayout) {
		// 	if(!actor.get_effect('grayscale-color')) {
		// 		child.add_effect_with_name('grayscale-color', effect);
		// 	}
		// }	

	});
	
	// Set the Application Windows to grey.
	global.get_window_actors().forEach(function(actor) {
		let meta_window = actor.get_meta_window();
		let effect = new GrayscaleEffect();
		if(!actor.get_effect('grayscale-color')) {
			actor.add_effect_with_name('grayscale-color', effect);
			meta_window._grayscale_window_tag = true;
		}

	}, this);
	
}


function removeGrayscale() {
	Main.uiGroup.get_children().forEach(actor => {
		if (actor instanceof Meta.WindowGroup) {
			actor.get_children().forEach(child => {
				child.remove_effect_by_name('grayscale-color');
			});
		}
	});

	global.get_window_actors().forEach(function(actor) {
		let meta_window = actor.get_meta_window();
		actor.remove_effect_by_name('grayscale-color');
		delete meta_window._grayscale_window_tag;
	}, this);
}






export default class GrayscaleWindow extends Extension {
	// constructor() {
    //     this.global_toggle = false;
    // }
	// ---------------------------------------------------------------
	// FOCUSED: Apply the grayscale effect to the currently focused window.
	// ---------------------------------------------------------------
	toggle_effect() {
		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if(meta_window.has_focus()) {
				if(actor.get_effect('grayscale-color')) {
					actor.remove_effect_by_name('grayscale-color');
					delete meta_window._grayscale_window_tag;
				}
				else {
					let effect = new GrayscaleEffect();
					actor.add_effect_with_name('grayscale-color', effect);
					meta_window._grayscale_window_tag = true;
				}
			}
		}, this);
	}
	// ---------------------------------------------------------------
	// GLOBAL: Apply the grayscale effect to the entire GNOME Shell, globally.
	// ---------------------------------------------------------------
	toggle_global_effect() {
		// if (this.global_toggle) {
		// 	removeGrayscale();
		// 	this.global_toggle = false;
		// } else {

		let uiGroup = Main.uiGroup
		if (uiGroup._grayscale_global_tag) {
			removeGrayscale();
			uiGroup._grayscale_global_tag = false;
		} else if (uiGroup._grayscale_global_tag === undefined || uiGroup._grayscale_global_tag === null || uiGroup._grayscale_global_tag == false) {
			applyGrayscale();
			uiGroup._grayscale_global_tag = true;
		}

	}

	enable() {
		this._settings = this.getSettings();

		Main.wm.addKeybinding(
			SHORTCUT,
			this._settings,
			Meta.KeyBindingFlags.NONE,
			Shell.ActionMode.NORMAL,
			() => { this.toggle_effect(); }
		);

		Main.wm.addKeybinding(
			GLOBAL_SHORTCUT,
			this._settings,
			Meta.KeyBindingFlags.NONE,
			Shell.ActionMode.NORMAL,
			() => { this.toggle_global_effect(); }
		);

		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if(meta_window.hasOwnProperty('_grayscale_window_tag')) {
				let effect = new GrayscaleEffect();
				actor.add_effect_with_name('grayscale-color', effect);
			}
		}, this);
	}

	disable() {
		Main.wm.removeKeybinding(SHORTCUT);
		Main.wm.removeKeybinding(GLOBAL_SHORTCUT);

		global.get_window_actors().forEach(function(actor) {
			actor.remove_effect_by_name('grayscale-color');
		}, this);

		this._settings = null;
	}
};

