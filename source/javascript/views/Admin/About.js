enyo.kind({
	name: 'Grundschrift.Views.Admin.About',
	kind: 'Grundschrift.Views.Admin.BaseView',
	events: {
		onBack: ''
	},
	components: [
		{
			kind:'onyx.Toolbar',  classes: "onlyToolbar",
			components:[
				{
					kind:'ImageButton',
					type:'Exit',
					ontap:'doBack'
				},
				{classes: 'view-heading', content: 'ÜBER DIESE APP'}
			]
		},
		{
			kind:'Scroller',
			style: 'padding: 0 20px 20px 20px;',
			fit:true,
			components:[
				{
					allowHtml: true,
					name: 'htmlContainer'
				}
			]
		}
	],
	create: function() {
		this.inherited(arguments);
		new enyo.Ajax({
			url: 'assets/about.html',
			handleAs: 'text'
		}).go().response(this, function(inSender, inContent) {
			this.$.htmlContainer.setContent(inContent);
		});
	}
});
