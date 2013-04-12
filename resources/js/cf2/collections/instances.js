/* instances.js
 * Backbone.js instances collection.
 */

Atmo.Collections.Instances = Atmo.Collections.Base.extend({
	model: Atmo.Models.Instance,
	initialize: function() {
		this.selected_instance = null;
	},
	test_shell_vnc: function() {
		var self = this;
		var url = function() {
			var creds = Atmo.get_credentials();
			return self.urlRoot
				+ '/provider/' + creds.provider_id 
				+ '/identity/' + creds.identity_id
				+ '/meta/test_links/';
		};
		
		$.ajax({
			url: url(),
			success: function(data) {
				_.each(data, function(v, k) {
					var model = self.get(k);
					model.set({
						'has_shell': v['shell'],
						'has_vnc': v['vnc']
					});
				});
			},
			error: function() {
			},
			dataType: 'json',
			traditional: true
		});
	},
	select_instance: function(model) {
		this.selected_instance = model;
		if (model == null) {
			Backbone.history.navigate('instances');
		}
		else {
			Backbone.history.navigate('instances/' + model.id);
			this.trigger('select', model);
		}
	},
	update: function(options) {
		if (!options) options = {};
		if (!options.success) options.success = function() {};
		if (!options.error) options.error = function() {};
		var new_collection = new this.constructor();
		new_collection.url = this.url;
		new_collection.model = this.model;
		
		var self = this;
		new_collection.fetch({
			force_new: true,
			success: function() {
				var model_ids = self.get_model_id_array();
				var new_model_ids = new_collection.get_model_id_array();
				
				// New models
				_.each(_.difference(new_model_ids, model_ids), function(model_id) {
					self.add(new_collection.get(model_id).clone());
				});
				
				// Models to remove
				_.each(_.difference(model_ids, new_model_ids), function(model_id) {
					self.remove(self.get(model_id));
				});
				
				// Models to update
				_.each(_.intersection(model_ids, new_model_ids), function(model_id) {
					var new_model = new_collection.get(model_id);
					var old_model = self.get(model_id);
					var to_update = _.omit(new_model.attributes, 'selected', 'running_shell', 'running_vnc', 'launch_time', 'has_shell', 'has_vnc');
					old_model.set(to_update);
				});
				
				// If the selected instance no longer exists, select a different instance
				if (self.selected_instance && self.selected_instance.collection == undefined) {
					if (self.models.length == 0) {
						self.select_instance(null);
					}
					else {
						self.models[0].select();
					}
				}
				
				// Retest shell and vnc
				self.test_shell_vnc();
				options.success();
			}
		});
	},
	get_model_id_array: function() {
		return _(this.models).map(function (model) {return model.id; });
	},
});
