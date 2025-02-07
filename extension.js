import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Meta from 'gi://Meta';
import St from 'gi://St';
import Shell from 'gi://Shell';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';


/*
    This extension allows the user to toggle grayscale on and off on their desktop.
		The extension provides two keybindings:
		1. `Super + G` - Toggles grayscale on the currently focused window.
		2. `Ctrl + Super + G` - Toggles grayscale on the entire GNOME Shell.
			(i.e. the wallpaper, desktop icons, and all application windows).
	
	GNOME has several components:
		- Meta
		- St
		- Clutter
		- etc.
	We leverage the `Clutter.DesaturateEffect` class to apply the grayscale effect.

	GNOME Development Tips:
	 - Use `looking glass`.
	   On Ubuntu, we can use `Alt + F2` and type `lg` to open the looking glass.
	   Here we can inspect the GNOME Shell elements and their properties.

	*/


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
// Applies grayscale effect to GNOME Shell elements:
// 1. Children inside `Main.uiGroup`, particularly elements of `Meta.WindowGroup` (background, wallpaper, desktop icons).
// 2. Open application windows retrieved via `global.get_window_actors()`.
function applyGlobalGrayscale() {
	// Set background grey
	Main.uiGroup.get_children().forEach(actor => {
		let effect = new GrayscaleEffect();		
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

// Removes grayscale effect from all affected elements.
function removeGlobalGrayscale() {
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
    // Toggles grayscale effect for the currently focused window.
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

    // Toggles grayscale effect globally for the entire GNOME Shell UI.
	toggle_global_effect() {
		let uiGroup = Main.uiGroup
		if (uiGroup._grayscale_global_tag) {
			removeGlobalGrayscale();
			uiGroup._grayscale_global_tag = false;
		} else if (uiGroup._grayscale_global_tag === undefined || uiGroup._grayscale_global_tag === null || uiGroup._grayscale_global_tag == false) {
			applyGlobalGrayscale();
			uiGroup._grayscale_global_tag = true;
		}

	}

	enable() {
		this._settings = this.getSettings();
		
		// Register keyboard shortcuts.
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

	// Cleanup when the extension is disabled.
	disable() {
		Main.wm.removeKeybinding(SHORTCUT);
		Main.wm.removeKeybinding(GLOBAL_SHORTCUT);

		global.get_window_actors().forEach(function(actor) {
			actor.remove_effect_by_name('grayscale-color');
		}, this);

		this._settings = null;
	}
};
