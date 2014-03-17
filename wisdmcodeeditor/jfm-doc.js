//require("$wisdmpages$/core/fileuploader.js");
require('wisdmjs:/3rdparty/spellcheck/spellcheck.js');

var jfm_doc_defined=false;
function define_jfm_doc() {
	
	if (!jfm_doc_defined) {
		jfm_doc_defined=true;
		var m_spell_checker=new SPELLCHECKER();
		m_spell_checker.initialize(function() {});
		
		window.jfm_doc_to_html=function(text,callback) {
			function STREAM() {
				var that=this;
				
				this.setText=function(text) {m_lines=text.split('\n'); m_current_line_index=0; m_current_pos=0; m_anchor_pos=0; m_current_line=m_lines[0]||'';};
				this.beginToken=function() {m_anchor_pos=m_current_pos;};
				this.advanceLine=function() {m_current_line_index++; m_current_line=m_lines[m_current_line_index]||''; m_current_pos=0; m_anchor_pos=0;};
				this.atEnd=function() {return (m_current_line_index>=m_lines.length);};
				
				this.eol=function() {return m_current_pos>=m_current_line.length;};
				this.sol=function() {return (m_current_pos===0);};
				this.peek=function() {return m_current_line.substr(m_current_pos,1);};
				this.next=function() {var ret=that.peek(); m_current_pos++; return ret;};
				this.eat=function(match) {if (that.peek()==match) {return that.next();} else return undefined;};
				this.eatWhile=function(match) {if (eat(match)) {while(eat(match)) {} return true;} else return false;};
				this.eatSpace=function() {eatWhile(' ');};
				this.skipToEnd=function() {m_current_pos=m_current_line.length;};
				this.skipTo=function(ch) {var ind=m_current_line.indexOf(ch,m_current_pos); if (ind>=0) {m_current_pos=ind; return true;} else {return false;}};
				this.backUp=function(n) {m_current_pos-=n;};
				this.current=function() {return m_current_line.substr(m_anchor_pos,m_current_pos-m_anchor_pos);};
				this.match=function(substr,consume) {
					var ind=m_current_line.indexOf(substr,m_current_pos);
					if (ind==m_current_pos) {
						if (consume) m_current_pos+=substr.length;
						return true;
					}
					return false;
				};
				
				var m_lines=[];
				var m_current_line_index=0;
				var m_current_line='';
				var m_current_pos=0;
				var m_anchor_pos=0;
			}
			
			var stream=new STREAM();
			stream.setText(text);
			var state=window.jfm_doc_start_state();
			state.html_mode=true;
			var html={element:null};
			
			var get_image_dimensions=function(name0,callback) {
				var url0='$wisdmpages$/../wisdm-public-files/'+name0+'.jpg';
				$.get(url0+'.ini?rnd='+makeRandomId(),function(ini_text) {
					var W=0,H=0;
					var lines=ini_text.split('\n');
					for (var jj=0; jj<lines.length; jj++) {
						var tmpvals=lines[jj].split('=');
						if (tmpvals.length==2) {
							var val1=tmpvals[0].trim();
							var val2=tmpvals[1].trim();
							if (val1=='image_width') W=parseInt(val2,10);
							if (val1=='image_height') H=parseInt(val2,10);
						}
					}
					if (W*H!==0) {
						callback([W,H]);
					}
					else {
						var img=$('<img></img>');
						
						img.attr('src',url0+'?rnd='+makeRandomId());
						img.load(function() {
							callback([img.width(),img.height()]);
							img.remove();
						});
						$('body').append(img);
					}
				}).fail(function() {
					callback([0,0]);
				});
			};
			
			var process_references_in_line=function(line,callback) {
				var reference_strings=[];
				var ind0=0;
				var done=false;
				while (!done) {
					var ind1=line.indexOf('[',ind0);
					if (ind1<0) done=true;
					else {
						if ((line[ind1+1]||'')=='[') {
							ind0=ind1+2;
						}
						else {
							var ind2=line.indexOf(']',ind1);
							if (ind2<0) {
								done=true;
							}
							else {
								var tmplist=line.substr(ind1+1,ind2-ind1-1).split(',');
								for (var i=0; i<tmplist.length; i++) reference_strings.push(tmplist[i]);
								ind0=ind2+1;
							}
						}
					}
				}
				var process_reference_string=function(jj) {
					if (jj>=reference_strings.length) {
						callback();
						return;
					}
					lookup_reference(reference_strings[jj],function() {
						process_reference_string(jj+1);
					});
				};
				process_reference_string(0);
			};
			
			var initialize_state=function(state,text,callback2) {
				state.image_dimensions={};
				state.references=[];
				state.references_by_id={};
				
				var lines=text.split('\n');
				var handle_line=function(jj) {
					if (jj>=lines.length) {
						callback2();
						return;
					}
					var line=lines[jj];
					if (line.substr(0,1)=='.') {
						var ind1=line.indexOf('(');
						var ind2=line.indexOf(')');
						var paramlist=[];
						var params={};
						if ((ind1>0)&&(ind2>ind1+1)) {
							paramlist=line.substr(ind1+1,ind2-ind1-1).split(',');
							for (var j=0; j<paramlist.length; j++) {
								var tmp=paramlist[j].split('=');
								if (tmp.length==2) params[tmp[0]]=tmp[1];
							}
						}
						if (line.indexOf('.image(')===0) {
							var name0=paramlist[0]||'';
							get_image_dimensions(name0,function(dims) {
								state.image_dimensions[name0]=dims;
								handle_line(jj+1);
							});
							return;
						}
					}
					process_references_in_line(line,function() {
						setTimeout(function() {handle_line(jj+1);},1);
					});
					return;
				};
				handle_line(0);
			};
			
			console.log ('initializing state...');
			initialize_state(state,text,function() {
				console.log ('generating html...');
				var ret='';
				while (!stream.atEnd()) {
					var line='';
					while (!stream.eol()) {
						stream.beginToken();
						window.jfm_doc_token(stream,state,html);
						line+=html.element;
					}
					if (line!=='') {
						if (state.default_style=='normal')
							line='<p class="MsoNormal">'+line+'</p>';
						else if (state.default_style=='caption')
							line='<p class="MsoNormal"><span class=caption>'+line+'</span></p>';
						ret+=line+'\n';
					}
					stream.advanceLine();
				}
				console.log ('adding bibliography');
				format_references(state.references,state.csl_style||'',function(formatted_references) {
					var biblio='';
					for (var kk=0; kk<formatted_references.length; kk++) {
						biblio+=formatted_references[kk]+'\n';
					}
					ret=ret.replace('$BIBLIOGRAPHY$',biblio);
					
					console.log ('setting style...');
					$.get('$wisdmpages$/widgets/wisdmcodeeditor/jfm-doc-template.txt?rnd='+makeRandomId(),function(html1) {
						html1=html1.replace('$TITLE$','');
						html1=html1.replace('$HTML$','<!---download--->\n'+ret);
						var docstyle0=state.docstyle||'style2';
						$.get('$wisdmpages$/widgets/wisdmcodeeditor/jfm-doc-styles/'+docstyle0+'.txt?rnd='+makeRandomId(),function(txt) {
							var html2=html1.replace('$HEAD$',txt);
							Wisdm.createFile({
								command:'doc-from-html',
								html:html2,
								filename:'doc-'+makeRandomId()+'.doc'
							},function(tmp) {
								if (tmp.url) {
									html2=html2.replace('<!---download--->','<p><a href="'+tmp.url+'">Download document</a></p>');
								}
								if (callback) callback(html2);
							});
						});
					});
				});
				
			});
		};
		
		var format_references=function(refs,csl_style,callback) {
			if (csl_style==='') {
				callback('');
				return;
			}
			
			var is_last_name_prefix=function(str) {
				var list=['van','de','der','vander'];
				if (list.indexOf(str.toLowerCase())>=0) return true;
				return false;
			};
			var parse_family_and_given_names=function(str) {
				var family0='';
				var tmplist=str.split(' ');
				var ind=0;
				while (is_last_name_prefix(tmplist[ind]||'')) {
					if (family0!=='') family0+=' ';
					family0+=tmplist[ind];
					ind++;
				}
				if (family0!=='') family0+=' ';
				family0+=tmplist[ind]||''; ind++;
				family0=family0.trim();
				
				var given0=tmplist[ind]||''; ind++;
				var given1=given0[0]||'';
				for (var i=1; i<given0.length; i++) given1+=' '+given0[i];
				given1=given1.trim();
				while (ind<tmplist.length) {given1+=' '+tmplist[ind]; ind++;}
				given1=given1.trim();
				
				return {family:family0,given:given1};
			};
			
			var ref_ids=[];
			var refs2={};
			for (var i=0; i<refs.length; i++) {
				var ref0=refs[i];
				ref_ids.push(ref0.Id||'');
				var year0=(ref0.PubDate||'').split(' ')[0]||'';
				var authors0=[];
				for (var aa=0; aa<(ref0.AuthorList||[]).length; aa++) {
					var A0=ref0.AuthorList[aa]||'';
					var family0=parse_family_and_given_names(A0).family;
					var given0=parse_family_and_given_names(A0).given;
					if (family0!=='') authors0.push({family:family0,given:given0});
				}
				var item0={
					id:ref0.Id||'',
					title:ref0.Title||'',
					author:authors0,
					"container-title":ref0.Source||'',
					issued:{"date-parts":[[year0]]},
					page:ref0.Pages||'',
					volume:ref0.Volume||'',
					issue:ref0.Issue||'',
					DOI:ref0.DOI||'',
					type:'article-journal'
				};
				refs2[ref0.Id]=item0;
			}
			
			
			$.get('$wisdmpages$/resources/csl/'+csl_style+'.csl',function(style) {
				var sys={
					retrieveItem:function(id){
						return refs2[id];
					},
					retrieveLocale:function(lang){
						return locale[lang];
					}
				};
				var citeproc=new CSL.Engine(sys,style);
				citeproc.updateItems(ref_ids);
				var ret1=citeproc.makeBibliography();
				var ret=ret1[1];
				callback(ret);
			})
			.fail(function() {
				jAlert('Unable to find csl style: '+csl_style);
			});
		};
		
		window.jfm_doc_start_state=function() {
			return {default_style:'normal',in_references:false,html_mode:false,in_custom_html:false,in_table:false};
		};
		window.jfm_doc_token=function(stream,state,html) {
			if (typeof(html)=='undefined') html={};
			
			var str;
			
			//AT BEGINNING OF LINE
			if (stream.sol()) {
				state.default_style='normal';
				state.in_references=false;
				
				//headings
				if (stream.peek()=='=') {
					state.default_style='heading';
					var count=0;
					while (stream.eat('=')) count++;
					stream.skipToEnd();
					if (count==1) {
						str=stream.current();
						if (state.html_mode) html.element='<h1>'+str.substr(1,str.length-2)+'</h1>';
						return 'heading1';
					}
					else if (count==2) {
						str=stream.current();
						if (state.html_mode) html.element='<h2>'+str.substr(2,str.length-4)+'</h2>';
						return 'heading2';
					}
					else if (count==3) {
						str=stream.current();
						if (state.html_mode) html.element='<h3>'+str.substr(3,str.length-6)+'</h3>';
						return 'heading3';
					}
				}
				//figure caption
				else if (stream.peek()=='+') {
					stream.next();
					state.default_style='caption';
					if (state.html_mode) html.element='';
					return 'caption';
				}
				//special syntax
				else if (stream.peek()=='.') {
					stream.skipToEnd();
					str=stream.current();
					
					if (state.html_mode) {
						html.element=get_html_element_from_syntax(str,state);
						state.default_style='bibliography';
					}
					
					if (str.indexOf('.beginHtml')===0) {
						state.in_custom_html=true;
						state.custom_html='';
					}
					else if (str.indexOf('.endHtml')===0) {
						state.in_custom_html=false;
					}
					else if (str.indexOf('.beginTable')===0) {
						state.in_table=true;
						state.table_text='';
					}
					else if (str.indexOf('.endTable')===0) {
						state.in_table=false;
					}
					return 'syntax';
				}
			}
			
			if (state.in_custom_html) {
				stream.skipToEnd();
				state.custom_html+=stream.current()+'\n';
				return 'syntax';
			}
			if (state.in_table) {
				stream.skipToEnd();
				state.table_text+=stream.current()+'\n';
				return 'syntax';
			}
			
			//REFERENCES
			if (state.in_references) {
				if (stream.peek()==',') {
					stream.next();
					if (state.html_mode) html.element=',';
					return 'references';
				}
				if (stream.peek()==']') {
					stream.next();
					state.in_references=false;
					if (state.html_mode) html.element=']';
					return 'references';
				}
				
				var done=false;
				while (!done) {
					var ch=stream.peek();
					if (!ch) {
						stream.next();
						schedule_update_references();
						
						return 'reference';
					}
					if ((!ch)||(ch==',')||(ch==']')) {
						if (!ch) stream.next();
						schedule_update_references();
						if (state.html_mode) {
							str=stream.current();
							var ref=find_cached_reference(str);
							if (ref) {
								if (!(ref.Id in state.references_by_id)) {
									ref.reference_number=state.references.length+1;
									state.references.push(ref);
									state.references_by_id[ref.Id]=ref;
								}
								var refnum=state.references_by_id[ref.Id].reference_number;
								html.element='<span class=reference title="'+str+': '+ref.Title+' ('+ref.Id+')">'+refnum+'</span>';
							}
							else {
								html.element='<span style="color:red;font-weight:bold" title="'+str+'">REF-NOT-FOUND</span>';
							}
						}
						return 'reference';
					}
					else {
						stream.next();
					}
				}
			}
			/////////////
			
			//in-line comment
			if (stream.match('[[',false)) {
				if (stream.skipTo(']')) {
					stream.match(']]',true);
				}
				else stream.skipToEnd();
				if (state.html_mode) html.element='<span class=comment>'+stream.current()+'</span>';
				return 'comment';
			}
			
			//references
			if (stream.match('[',true)) {
				state.in_references=true;
				if (state.html_mode) html.element='[';
				return 'references';
			}
			
			//full-line comment
			if (stream.peek()=='#') {
				stream.skipToEnd();
				if (state.html_mode) html.element='<span class=comment>'+stream.current()+'</span>';
				return 'comment';
			}
			
			//bold
			if (stream.peek()=='*') {
				stream.next();
				if ((stream.skipTo('*'))||(stream.skipTo(' '))) {
					stream.next();
				}
				else stream.skipToEnd();
				str=stream.current();
				if (state.html_mode) html.element='<span class=bold style="font-weight:bold">'+str.substr(1,str.length-2)+'</span>';
				return 'bold';
			}
			
			//italics
			if (stream.match('//',false)) {
				stream.next();
				stream.next();
				if (stream.skipTo('//')) {
					stream.next();
					stream.next();
				}
				else if (stream.skipTo(' ')) {
					stream.next();
				}
				else stream.skipToEnd();
				str=stream.current();
				if (state.html_mode) html.element='<span class=italics style="font-style:italic">'+str.substr(2,str.length-4)+'</span>';
				return 'italics';
			}
			
			//parse a word
			var ret_style=state.default_style;
			var rx_word = "!\"#$%&()*+,-./:;<=>?@[\\\\\\]^_`{|}~";
			if (stream.match(/^\w/)) {
				while (stream.match(/^\w/)) {}
				if (!m_spell_checker.check(stream.current())) {
					ret_style='spelling-error';
				}
			}
			else {
				stream.next();
			}
			
			if (state.html_mode) html.element=stream.current();
			return ret_style;
		};
		var get_html_element_from_syntax=function(str,state) {
			var ind1=str.indexOf('(');
			var ind2=str.indexOf(')');
			var paramlist=[];
			var params={};
			if ((ind1>0)&&(ind2>ind1+1)) {
				paramlist=str.substr(ind1+1,ind2-ind1-1).split(',');
				for (var j=0; j<paramlist.length; j++) {
					var tmp=paramlist[j].split('=');
					if (tmp.length==2) params[tmp[0]]=tmp[1];
				}
			}
			if (str.indexOf('.image(')===0) {
				var name0=paramlist[0]||'';
				var height0=params.height||200;
				var image_dims=state.image_dimensions[name0]||[1,1];
				var width0=height0;
				if (image_dims[0]*image_dims[1]!==0) {
					width0=height0*image_dims[0]/image_dims[1];
				}
				if (name0!=='') {
					var url0='$wisdmpages$/../wisdm-public-files/'+name0+'.jpg?rnd='+makeRandomId();
					return '<p class=MsoNormal><img src="'+url0+'" width='+width0+' height='+height0+'></img></p>';
				}
				else return '';
			}
			if (str.indexOf('.bibliography')===0) {
				state.csl_style=paramlist[0]||'';
				return '<div class=bibliography>\n$BIBLIOGRAPHY$\n</div>';
			}
			if (str.indexOf('.endHtml')===0) {
				return '\n'+(state.custom_html||'')+'\n';
			}
			if (str.indexOf('.endTable')===0) {
				return '\n'+get_table_html(state.table_text||'')+'\n';
			}
			if (str.indexOf('.docstyle')===0) {
				state.docstyle=paramlist[0];
			}
			return '';
		};

		var m_update_references_scheduled=false;
		var schedule_update_references=function() {
			if (m_update_references_scheduled) return;
			m_update_references_scheduled=true;
			setTimeout(function() {
				do_update_references(function() {
					m_update_references_scheduled=false;
				});
			},200);
		};
		$(window).resize(schedule_update_references);
		var periodic_update=function() {
			schedule_update_references();
			setTimeout(periodic_update,1000);
		};
		periodic_update();
		var do_update_references=function(callback) {
			var do_update_reference=function(X,callback) {
				X.attr('title','Looking up reference...');
				X.removeClass('cm-reference');
				X.addClass('cm-reference-not-found');
				lookup_reference(X.html(),function(tmp) {
					if (tmp.found) {
						var str;
						if (tmp.refs.length==1) {
							X.removeClass('cm-reference-not-found');
							X.addClass('cm-reference-found');
							str=tmp.refs[0].Id+': '+tmp.refs[0].Title+', '+tmp.refs[0].Source;
							X.attr('title',str);
						}
						else {
							X.removeClass('cm-reference-not-found');
							X.addClass('cm-reference-multiple-found');
							str='Multiple references found:\n';
							for (var i=0; i<tmp.refs.length; i++) {
								str+='('+tmp.refs[i].Id+': '+tmp.refs[i].Title+', '+tmp.refs[i].Source+')\n';
							}
							X.attr('title',str);
						}
					}
					else {
						X.attr('title','Reference not found.');
					}
					if (callback) callback();
				});
			};
			var num_updated=0;
			
			//this is a necessary hack -- we don't want to include the "measured" elements
			var tmp=$('.CodeMirror-measure span.cm-reference');
			tmp.removeClass('cm-reference');
			tmp.addClass('cm-reference-not-found');
			////////////////////////////
			
			var list=$('.cm-s-jfm-doc span.cm-reference');
			if (list.length===0) {
				if (callback) callback();
				return;
			}
			for (var i=0; i<list.length; i++) {
				var X=$(list[i]);
				do_update_reference(X,function() {
					num_updated++;
					if (num_updated>=list.length) {
						if (callback) callback();
					}
				});
			}
		};
		var string_contains=function(str,substr) {
			if (!str) return false;
			if (typeof(str)!='string') return false;
			return (str.toLowerCase().indexOf(substr.toLowerCase())>=0);
		};
		var reference_has_keyword=function(keyword,ref) {
			if (string_contains(ref.Source,keyword)) return true;
			if (string_contains(ref.Title,keyword)) return true;
			return false;
		};
		var reference_matches=function(text,ref) {
			if (text.indexOf('PMID=')>=0) {
				var pmid=text.substr(text.indexOf('PMID=')+5);
				return (ref.Id==pmid);
			}
			
			var words=text.match(/[^ ]+/g)||[];
			var keywords0=[];
			for (var i=1; i<words.length-1; i++) {
				keywords0.push(words[i]);
			}
			var author=words[0]||''; author=author.replace('-',' ');
			var year=words[words.length-1]||'';
			
			if ((string_contains(ref.PubDate,year))&&(ref.AuthorList)&&(string_contains(ref.AuthorList[0],author))) {
				for (var j=0; j<keywords0.length; j++) {
					if (!reference_has_keyword(keywords0[j],ref)) {
						return false;
					}
				}
				return true;
			}
			return false;
		};
		var m_cached_reference_lookups={};
		var find_cached_reference=function(text) {
			if (text in m_cached_reference_lookups) {
				return m_cached_reference_lookups[text];
			}
			else return null;
		};
		var lookup_reference=function(text,callback) {
			var ref1=find_cached_reference(text);
			if (ref1) {
				callback({found:true,refs:[ref1]});
				return;
			}
			var words=text.match(/[^ ]+/g)||[];
			var keywords0=[];
			for (var i=1; i<words.length-1; i++) {
				keywords0.push(words[i]);
			}
			var author=words[0]||'';
			author=author.replace('-',' ');
			
			var year=words[words.length-1]||'';
			
			if ((author.length<2)||(year.length!==4)) {
				callback({found:false});
				return;
			}
			
			lookup_in_pubmed({first_author:author,year:year,keywords:keywords0},function(refs) {
				//var refs=test_refs;
				/*var matched_refs=[];
				for (var i=0; i<refs.length; i++) {
					if (reference_matches(text,refs[i])) {
						matched_refs.push(refs[i]);
					}
				}*/
				var matched_refs=refs;
				if (matched_refs.length===0) {
					callback({found:false});
				}
				else {
					if (matched_refs.length==1) {
						m_cached_reference_lookups[text]=matched_refs[0];
					}
					callback({found:true,refs:matched_refs});
					return;
				}
			});
		};
	}
	CodeMirror.defineMode('jfm-doc',function(config,mode_config) {
		return {
			startState:window.jfm_doc_start_state,
			token:window.jfm_doc_token
		};
	});
}

function PubmedCache() {
		var that=this;
		this.getLookup=function(params) {
			var tmp='PUBMED-QUERY-'+JSON.stringify(params);
			if (typeof(localStorage)=='undefined') {
				if (tmp in m_cache) return m_cache[tmp];
				else return null;
			}
			else {
				if (tmp in localStorage) {
					try {
						return JSON.parse(localStorage[tmp]);
					}
					catch(err) {
						return null;
					}
				}
				else return null;
			}
		};
		this.setLookup=function(params,result) {
			var tmp='PUBMED-QUERY-'+JSON.stringify(params);
			if (typeof(localStorage)=='undefined') {
				m_cache[tmp]=result;
			}
			else {
				localStorage[tmp]=JSON.stringify(result);
			}
		};
		
		var m_cache={};
}
var PUBMED_CACHE=new PubmedCache();
function lookup_in_pubmed(params,callback) {
	
	var tmp=PUBMED_CACHE.getLookup(params);
	if (tmp) {
		callback(tmp);
		return;
	}
	
	var db = 'pubmed';
	var query = params.first_author+'[Author - First] AND ("'+params.year+'"[Date - Publication] : "'+params.year+'"[Date - Publication])';
	var keywords=params.keywords||[];
	for (var ii=0; ii<keywords.length; ii++) {
		query+=' AND '+keywords[ii]+'[Title]';	
	}
	
	// assemble the esearch URL
	var base = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
	var url = base + "esearch.fcgi?db="+db+"&term="+query+"&usehistory=y&retmax=5";
	
	if (localStorage.offline==='true') {
		disp ('localStorage.offline="true".');
		callback([]);
		return;
	}
	
	//post the esearch URL
	console.log ('Query: ',url);
	$.get(url,function(output) {
		var web,key;
		try {
			web=output.documentElement.getElementsByTagName('WebEnv')[0].textContent;
			key=output.documentElement.getElementsByTagName('QueryKey')[0].textContent;
		}
		catch(err) {
			console.log (err);
			callback([]);
			return;
		}
			
		url = base + "esummary.fcgi?db="+db+"&query_key="+key+"&WebEnv="+web+'&retmax=5';
		$.get(url,function(output) {
			window.xml2=output;
			
			var get_value_from_item_node=function(node) {
				var type0=node.getAttribute('Type');
				if (type0=='List') {
					var ret=[];
					for (k=0; k<node.childNodes.length; k++) {
						if (node.childNodes[k].tagName=='Item') {
							ret.push(get_value_from_item_node(node.childNodes[k]));
						}
					}
					return ret;
				}
				else {
					return node.textContent;
				}
			};
			
			var tmp=[];
			var docsums=output.documentElement.getElementsByTagName('DocSum');
			for (var i=0; i<docsums.length; i++) {
				var nodes0=docsums[i].childNodes;
				var tmp2={};
				for (var j=0; j<nodes0.length; j++) {
					if (nodes0[j].tagName=='Item') {
						tmp2[nodes0[j].getAttribute('Name')]=get_value_from_item_node(nodes0[j]);
					}
				}
				tmp2.Id=docsums[i].getElementsByTagName('Id')[0].textContent;
				tmp.push(tmp2);
			}
			PUBMED_CACHE.setLookup(params,tmp);
			callback(tmp);
		})
		.fail(function() {callback([]);});
	})
	.fail(function() {callback([]);});
}


var upload_image=function(name,callback) {
	var FF=new FileUploader();
	FF.onFilesLoaded(function() {
		if (FF.fileCount()!=1) return;
		var file_name=FF.fileName(0);
		var suf=utils.get_file_suffix(file_name);
		if (suf!='jpg') return;
		Wisdm.setPublicFile({file_name:name+'.'+suf,data:FF.fileData(0)},function() {
			FF.setFileUploadedToServer(0);
			if (callback) callback();
		});
	});
	FF.showUploadDialog({});
};

var m_jfm_doc_widgets={};
var create_jfm_doc_widget=function(wtype,params) {
	var div0,inv;
	if (wtype=='image') {
		var code='image--'+JSON.stringify(params);
		if (code in m_jfm_doc_widgets) return m_jfm_doc_widgets[code];
		var get_src_url=function() {
			return '$wisdmpages$/../wisdm-public-files/'+params.name+'.jpg?rnd='+makeRandomId();
		};
		var img0=$('<img src="'+get_src_url()+'" style="position:absolute"></img>');
		div0=$('<div class=wisdmpapers></div>');
		div0.append(img0);
		var height0=200;
		if ('height' in params) height0=params.height;
		div0.css({height:height0});
		img0.css({width:'auto',height:height0});
		
		m_jfm_doc_widgets[code]=div0;
		
		inv=$('<div class=invisible style="display:none"></div>');
		inv.append(div0);
		$('body').append(inv);
		
		img0.click(function(evt) {
			if (div0.closest('.wisdm-can-edit').length>0) {
				upload_image(params.name,function() {
					img0.attr('src',get_src_url());
				});
			}
		});
		
		return div0;
	}
	else if (wtype=='html') {
		div0=$('<div class=wisdmpapers></div>');
		div0.html(params.html);
		
		return div0;
	}
	return null;
};
var split_csv_line=function(line) {
	var ret=[];
	var curval='';
	var in_quote=false;
	for (var i=0; i<line.length; i++) {
		if (in_quote) {
			if (line[i]=='\"') in_quote=false;
			else curval+=line[i];
		}
		else {
			if (line[i]=='\"') in_quote=true;
			else if (line[i]==',') {
				ret.push(curval);
				curval='';
			}
			else curval+=line[i];
		}
	}
	if ((curval.length>0)&&(!in_quote)) ret.push(curval);
	return ret;
};
var get_table_html=function(txt) {
	var rows=[];
	var lines=txt.split('\n');
	var i,j;
	for (i=0; i<lines.length; i++) {
		var vals=split_csv_line(lines[i]);
		rows.push(vals);
	}
	var ret='';
	ret+='<table>\n';
	for (i=0; i<rows.length; i++) {
		var tmp='<tr>';
		for (j=0; j<rows[i].length; j++) {
			var tmp2=rows[i][j];
			if ((tmp2[0]||'')=='*') tmp+='<th>'+tmp2.substr(1)+'</th>';
			else tmp+='<td>'+tmp2+'</td>';
		}
		tmp+='</tr>';
		ret+=tmp+'\n';
	}
	ret+='</table>\n';
	return ret;
};
function get_jfm_doc_widgets(lines) {
	var doc_widgets={};
	var ret=[];
	for (var i=0; i<lines.length; i++) {
		var line0=lines[i];
		var div0;
		
		var ind0=line0.indexOf('.image(');
		if (ind0>=0) {
			var ind1=line0.indexOf('(',ind0);
			var ind2=line0.indexOf(')',ind0);
			if ((ind1>ind0)&&(ind2>ind1+1)) {
				var strlist=line0.substr(ind1+1,ind2-ind1-1).split(',');
				if (strlist.length>=1) {
					var params={name:strlist[0]};
					for (var j=1; j<strlist.length; j++) {
						var tmp=strlist[j].split('=');
						if (tmp.length==2) params[tmp[0]]=tmp[1];
					}
					div0=create_jfm_doc_widget('image',params);
					if (div0) {
						ret.push({line:i,div:div0});
					}
				}
			}
		}
		
		if (line0.indexOf('.beginTable')===0) {
			var txt1='';
			var jj=i+1;
			var done=false;
			while ((!done)&&(jj<lines.length)) {
				if (lines[jj].indexOf('.endTable')===0) done=true;
				else {
					txt1+=lines[jj]+'\n';
					jj++;
				}
			}
			if (txt1!=='') {
				var html0=get_table_html(txt1);
				div0=create_jfm_doc_widget('html',{html:html0});
				if (div0) {
					ret.push({line:Math.max(i-1,0),div:div0});
				}
			}
		}
		
	}
	return ret;
}

function xmlToJson(xml) {
	var attr,
			child,
			attrs = xml.attributes,
			children = xml.childNodes,
			key = xml.nodeType,
			obj = {},
			i = -1;

	if (key == 1 && attrs.length) {
		obj[key = '@attributes'] = {};
		while (attr = attrs.item(++i)) {
			obj[key][attr.nodeName] = attr.nodeValue;
		}
		i = -1;
	} else if (key == 3) {
		obj = xml.nodeValue;
	}
	while (child = children.item(++i)) {
		key = child.nodeName;
		if (obj.hasOwnProperty(key)) {
			if (obj.toString.call(obj[key]) != '[object Array]') {
				obj[key] = [obj[key]];
			}
			obj[key].push(xmlToJson(child));
		}
		else {
			obj[key] = xmlToJson(child);
		}
	}
	return obj;
}