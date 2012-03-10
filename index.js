/*
* Simple Form generator for jugglingdb
* (c) 2012 Amir M. Mahmoudi <a-mahmoudi.com>
* MIT license
*
* This Modules is based on Jugglingdb and written for express-on-railway
* https://github.com/1602/jugglingdb
* https://github.com/1602/express-on-railway
*/

 var util = require('util');

exports.init = function () {
	// add orm method
	railway.orm.AbstractClass.extProperty = extendProperty;
	railway.orm.AbstractClass.FormSchema = generate_form;

    // add view helper
    railway.helpers.HelperSet.prototype.SQLFORM = sqlformHelper;
};

/**
 * Extend Properties in jugglingdb
 *
 * @param obj - this is an object that contain some new feature for properties
 */
function extendProperty(obj) {
	var model = this.schema.definitions[this.modelName];
	
	if(typeof obj === 'object') {
		Object.keys(obj).forEach(function (o) {
			var property = model.properties[o];
			Object.keys(obj[o]).forEach(function (propertyKey) {
				if(propertyKey === 'widget' && typeof obj[o][propertyKey] !== 'function') {
					return true;	
				}
				property[propertyKey] = obj[o][propertyKey];
			});
		});
	}

	return this;
}


/**
 * Generate a Insert/Edit Form based on schema structure
 *
 * @param info - Form information {name, action, method: "Post", enctype: "multipart/form-data", SubmitButtonValue}
 * @param data - if generator used for edit, data is a recored of schema
 * @param fields - specifying which fields of schema should be in form
 */
function generate_form(info, data, fields) {
	try {	
		var err;
		var model = this.schema.definitions[this.modelName];
		var formName = formId = info['name'] ? info['name'] : this.modelName;
		var formType = info['enctype'] ? info['enctype'] : 'multipart/form-data';
		var formAction = info['action'] ? info['action'] : '';
		var formMethod = info['method'] ? info['method'] : 'POST';
		var formFields = util.isArray(fields) ? fields : [];
		var formData = (typeof data === 'object') ? data : '';

		//We create an object with our forms element, then return it to user
		var output = 
		{ 
			form: 
			{
				name: formName,
				enctype: formType,
				action: formAction,
				method: formMethod
			}
		}

		//filter properties and get final properties that we want to be in form
		properties =  filter_fields(model.properties, formFields, formData);
		
		output['form']['properties'] = properties;

		return output;
	} catch (err) {
		throw new Error(err);
	}

}

/**
 * Generate a form based on tables 
 * TODO: add tabless style
 *
 * @param formSchema - Object - this is form object
 * @param extData - Object - This object has recieve some extera data form our form as describe below
 *
 * extData = {submit_button:'value', hidden: {fieldName:{id:'',value:''}, fieldName2: {id:'', value:''}}, table_details: '' }
 */
function sqlformHelper(formSchema, extData) {
	var self = this;
	var buf = arguments.callee.caller.buf;


	if(typeof formSchema === 'object' && typeof formSchema['form'] === 'object') {
		var form = formSchema.form,
			modelName = formSchema['form']['name'];

	    // default method is POST
	    if (!form.method) {
	        form.method = 'POST';
	    }

	    // hook up alternative methods (PUT, DELETE)
	    var method = _method = form.method.toUpperCase();
	    if (method != 'GET' && method != 'POST') {
	        _method = method;
	        form.method = 'POST';
	    }

		buf.push(util.format('<form id="%s" name="%s" enctype="%s" action="%s" method="%s">', form.name, form.name, form.enctype, form.action, form.method));
		buf.push('<input type="hidden" name="' + this.controller.request.csrfParam + '" value="' + this.controller.request.csrfToken + '" />');

	    // alternative method?
	    if (_method !== form.method) {
	        buf.push(railway.helpers.input_tag({type: "hidden", name: "_method", value: _method }));
	    }

		//Check for extra hidden fields
		if(typeof extData['hidden'] === 'object') {
			var hiddens = extData['hidden'];
			Object.keys(hiddens).forEach(function (hideFields) {
				buf.push(railway.helpers.input_tag({type: "hidden", name: hideFields, value:  hiddens[hideFields].value }))
			});
		}

	    function makeName(name) {
	        return form.name + '__' + name ;
	    }

	    function makeId(prop,name) {
	        return form.name + '_' + prop + '__' + name;
	    }		

		var properties = formSchema['form']['properties'];
		if(typeof properties === 'object') {
			buf.push(util.format('<table %s><tbody>', extData['table_details'] || ''));

			Object.keys(properties).forEach(function (prop) {
				buf.push(util.format('<tr id="%s">', makeId(prop, 'row')));

				if(prop.substr(0,12) === '__splitter__') {	
					if(typeof properties[prop].widget === "function") {
						buf.push('<td class="rqf_splitter" colspan="3">' + properties[prop].widget(properties[prop].args || '') + '</td>');
					} else if (properties[prop].widget.toUpperCase() === 'HR') {
						buf.push('<td class="rqf_splitter" colspan="3"><hr /></td>');
					}
				} else {

					// Caption for fields
					// first check if caption is defined with extend property or not
					// if not, try to get caption from locales file based on current locale, and if can't find, just set the property name
					buf.push(util.format('<td class="rqf_caption"><lable id="%s">%s</lable></td>', makeId(prop, 'caption'), properties[prop]['label'] || self.controller.t('models.' + modelName + '.fields.' + prop, prop)));

					// Input control for our fields, the defualt field is Input text box
					buf.push('<td class="rqf_field">');
					
					if(typeof properties[prop]['widget'] === 'function') {
						buf.push(properties[prop]['widget'](prop, properties[prop]['value']));
					} else {
						if(properties[prop].type.name === 'Text') {
							buf.push(util.format('<textarea id="%s" name="%s" class="text%s" %s>%s</textarea>', prop, prop, (properties[prop]['class']) ? ' ' + properties[prop]['class'] : '', (properties[prop]['style']) ? ' style="' + properties[prop]['style'] + '"' : '', properties[prop]['value']));
						} else if (properties[prop].type.name === 'Boolean') {
							buf.push(util.format('<input type="checkbox" id="%s" name="%s" class="text%s" %s%s />', prop, prop, (properties[prop]['class']) ? ' ' + properties[prop]['class'] : '', (properties[prop]['style']) ? ' style="' + properties[prop]['style'] + '"' : '', (properties[prop]['value']) ? ' CHECKED' : ''));
						} else {
							buf.push(util.format('<input type="text" id="%s" name="%s" value="%s" class="text%s" %s />', prop, prop, properties[prop]['value'], (properties[prop]['class']) ? ' ' + properties[prop]['class'] : '', (properties[prop]['style']) ? ' style="' + properties[prop]['style'] + '"' : ''));
						}
					}
					buf.push('</td>');

					//Comment Label
					var comment_lable = properties[prop]['comment'] || self.controller.t('models.' + modelName + '.comments.' + prop) || '';
					if(comment_lable !== '') {
						buf.push(util.format('<td class="rqf_comment"><lable id="%s">%s</lable></td>', makeId(prop, 'comment'), comment_lable));
					} else {
						buf.push('<td class="rqf_comment"></td>');
					}

				}

				buf.push('</tr>');
			});

			//Add submit button
			if(extData['submit_button'] !== 'none') {
				extData['submit_button'] = (typeof extData['submit_button'] === 'object') ? extData['submit_button'] : {};
				buf.push(util.format('<tr id="rqf_submits"><td colspan="3"><input type="submit" name="rqf_submitform" value="%s"%s%s /></td></tr>', (typeof extData['submit_button']['value'] !== 'undefined') ? extData['submit_button']['value'] : 'Submit', (typeof extData['submit_button']['class'] !== 'undefined') ? ' class="' + extData['submit_button']['class'] + '"' : '', (typeof extData['submit_button']['style'] !== 'undefined') ? ' style="' + extData['submit_button']['style'] + '"' : ''));
			}

			buf.push('</tbody></table>');
		}

		buf.push('</form>');
	}

}

/**
 * Filter properties from the whole properties, maybe we want some of properties for our form
 *
 * @param properties - Object - the whole properties we defined for our schema
 * @param fields - Array - array of specific property to shown in form
 * @param data - Object - object of data using for update form or default values
 *
 */
function filter_fields(properties, fields, data) {
	var true_prop = {};
	Object.keys(properties).forEach(function (prop) {
		if(fields.length === 0 || fields.indexOf(prop) >= 0) {
			if (typeof data === 'object' && data[prop]) {
				properties[prop]['value'] = data[prop];
			} else if(typeof properties[prop]['default'] != 'undefined') {
				properties[prop]['value'] = properties[prop]['default'];
			} else {
				properties[prop]['value'] = '';
			}
			true_prop[prop] = properties[prop];
		}
	});

	return true_prop;
}