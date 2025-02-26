var cslot = 0
var maxslot = 0
var minslot = 0
var naipan = 26666

var kizuna = new Array();
kizuna["N"] = [25, 50]
kizuna["R"] = [100, 200]
kizuna["SR"] = [250, 500]
kizuna["UR"] = [500, 1000]
kizuna["SSR"] = [375, 750]

/** @type {LLH.Layout.Skill.LLSkillComponent} */
var comp_skill;
/** @type {LLH.Layout.Skill.LLSkillComponent} */
var comp_skill2;
/** @type {LLH.Selector.LLCardSelectorComponent} */
var comp_cardselector;
/** @type {LLH.Component.LLAvatarComponent} */
var comp_image_avatar;
/** @type {LLH.Component.LLAvatarComponent} */
var comp_image_avatar2;
/** @type {LLH.Component.LLImageComponent} */
var comp_image_card;
/** @type {LLH.Component.LLImageComponent} */
var comp_image_card2;
/** @type {LLH.Component.LLImageComponent} */
var comp_image_navi;
/** @type {LLH.Component.LLImageComponent} */
var comp_image_navi2;
/** @type {LLH.Layout.Language.LLLanguageComponent} */
var comp_language;

function changenaipan(){
   if (!document.getElementById('naipan').checked)
      naipan = 26667
   else
      naipan = 15000
   changecolor()
}

function slotup(){
   cslot += 1
   if (cslot > maxslot)
      cslot = minslot
   changecolor()
}

function slotdown(){
   cslot -= 1
   if (cslot < minslot)
      cslot = maxslot
   changecolor()
}

function getmaxstrength(card){
   var result = 0;
   var slot = card.maxslot;
   if (card.maxslot === undefined) slot = 0;
   var att = card[card.attribute+'2']+kizuna[card.rarity][1];
   var skill = 0;
   if (card.skilldetail !== undefined) {
      skill = skillstrength(card, 7, 1, 1);
   }
   if (card.skilleffect == 11){
      if ((skill*1.5 > att*0.208*1.15) && (slot >= 4))
         result = parseInt(att*(1+0.052*(slot-4))*1.15+skill*2.5)
      else
         result = parseInt(att*(1+0.052*(slot))*1.15+skill)
   }
   else if (card.skilleffect == 9){
      if ((skill*naipan > att*0.208*1.15) && (slot >= 4))
         result = parseInt(att*(1+0.052*(slot-4))*1.15+skill*naipan)
      else
         result = parseInt(att*(1+0.052*(slot))*1.15)
   }
   else
      result = parseInt(att*(1+0.052*(slot))*1.15)
   return result
}

/**
 * 
 * @param {LLH.Component.LLComponentBase | string} elementid 
 * @param {boolean} show 
 * @param {(e: LLH.Component.LLComponentBase | string) => void} show_callback 
 */
function update_visible(elementid, show, show_callback) {
   if (typeof(elementid) == 'string') {
      if (show) {
         document.getElementById(elementid).style.display = '';
         if (show_callback) show_callback(elementid);
      } else {
         document.getElementById(elementid).style.display = 'none';
      }
   } else {
      if (show) {
         elementid.show();
         if (show_callback) show_callback(elementid);
      } else {
         elementid.hide();
      }
   }
}

/**
 * @param {LLH.Component.LLAvatarComponent} comp 
 * @param {LLH.Core.CardIdStringType} cardid 
 * @param {LLH.Core.MezameType} mezame 
 * @param {boolean} show 
 */
function update_avatar(comp, cardid, mezame, show) {
   update_visible(comp, show, function() {
      comp.setCard(cardid, mezame);
   });
}

function update_card_image(comp, card, mezame, show, small) {
   update_visible(comp, show, function() {
      comp.setSrcList(LLUnit.getImagePathList(card, 'card', mezame));
      if (small) {
         comp.element.style.height = '422px';
         comp.element.style.width = '300px';
      } else {
         comp.element.style.height = '';
         comp.element.style.width = '';
      }
   });
}

function update_navi_image(comp, card, mezame, show, small) {
   update_visible(comp, show, function() {
      comp.setSrcList(LLUnit.getImagePathList(card, 'navi', mezame));
      if (small) {
         comp.element.style.height = '300px';
         comp.element.style.width = '300px';
      } else {
         comp.element.style.height = '';
         comp.element.style.width = '';
      }
   });
}

function changecolor(){
   var index = comp_cardselector.getCardId();
   if (index == "") {
      document.getElementById("result").style.display = 'none'
      comp_skill.setCardData();
      comp_skill2.setCardData();
      return;
   }
   var need_scroll = (document.getElementById("result").style.display == 'none');
   LoadingUtil.startSingle(LLCardData.getDetailedData(index)).then(function (curCard) {
      document.getElementById("result").style.display = ''
      var infolist2 = ["smile", "pure", "cool"]

      //avatar, image
      var show_not_mezame = ((curCard.special == 0) && (curCard.support == 0));
      var show_card = document.getElementById('showcard').checked;
      var show_small = document.getElementById('smallcard').checked;
      document.getElementById('notmezame').style.display = (show_not_mezame ? '' : 'none');
      update_avatar(comp_image_avatar, index, 0, show_not_mezame);
      update_avatar(comp_image_avatar2, index, 1, true);
      update_card_image(comp_image_card, curCard, 0, show_not_mezame && show_card, show_small);
      update_card_image(comp_image_card2, curCard, 1, show_card, show_small);
      update_navi_image(comp_image_navi, curCard, 0, show_not_mezame && show_card, show_small);
      update_navi_image(comp_image_navi2, curCard, 1, show_card, show_small);
      update_visible('skill2', !show_not_mezame);
      update_visible('skillslot2', !show_not_mezame);
      update_visible('centerskill2', !show_not_mezame);
      update_visible('skilleffect2', !show_not_mezame);
      document.getElementById('hp1').innerHTML = curCard.hp
      document.getElementById('hp2').innerHTML = parseInt(curCard.hp)+1
      document.getElementById('kizuna1').innerHTML = kizuna[curCard.rarity][0]
      document.getElementById('kizuna2').innerHTML = kizuna[curCard.rarity][1]
      var cnname = curCard.skillname
      var jpname = curCard.jpskillname
      minslot = curCard.minslot;
      maxslot = curCard.maxslot;
      if (cslot == -1)
         cslot = minslot
      document.getElementById('skillslot').innerHTML = '<input type="button" style="height:20px;width:20px;padding:0" value="▲" onclick="slotup()"></input>'+String(cslot)+' <input type="button" style="height:20px;width:20px;padding:0" value="▼" onclick="slotdown()"></input>'
      document.getElementById('skillslot2').innerHTML = document.getElementById('skillslot').innerHTML
      var skillname = (cnname == jpname ? (cnname ? '【'+jpname+'】' : '无') : '【'+cnname+'】<br>【'+jpname+'】');
      document.getElementById('skillname').innerHTML = skillname;
      document.getElementById('skillname2').innerHTML = skillname;
      comp_skill.setCardData(curCard);
      comp_skill2.setCardData(curCard);
      var skilllevel = comp_skill.skillLevel;
        document.getElementById('centerskill').innerHTML = LLUnit.getCardCSkillText(curCard, true)
        document.getElementById('centerskill2').innerHTML = LLUnit.getCardCSkillText(curCard, true)
        changeskilleffect(curCard, skilllevel)
        for (i in infolist2){
            document.getElementById(infolist2[i]+'1').innerHTML = curCard[infolist2[i]]
            document.getElementById(infolist2[i]+'2').innerHTML = curCard[infolist2[i]+'2']
        }
      colors = ['smile','pure','cool']
      for (i in colors){
         atttype = colors[i]
         if (curCard.smile != 0){
            tmpc = curCard
            att = tmpc[atttype]
            if (tmpc.attribute != atttype)
               att /= 1.1
            else
               att += kizuna[tmpc.rarity][0]
            skill = (tmpc.skilldetail === undefined ? 0 : skillstrength(tmpc, skilllevel, 1, 1));
            if (tmpc.skilleffect == 11){
               if ((skill*1.5 > att*0.208*1.15) && (minslot >= 4)){
                  document.getElementById(atttype+'strength1').innerHTML = parseInt(att*(1+0.052*(minslot-4))*1.15+skill*2.5)+'<br>(加分宝石)'
               }
               else{
                     document.getElementById(atttype+'strength1').innerHTML = parseInt(att*(1+0.052*(minslot))*1.15+skill)
               }
            }
            else if (tmpc.skilleffect == 9){
               if ((skill*naipan > att*0.208*1.15) && (minslot >= 4)){
                  document.getElementById(atttype+'strength1').innerHTML = parseInt(att*(1+0.052*(minslot-4))*1.15+skill*naipan)+'<br>(回血宝石)'
                  }
               else{
                  document.getElementById(atttype+'strength1').innerHTML = parseInt(att*(1+0.052*(minslot))*1.15)
               }
            }
            else{
               document.getElementById(atttype+'strength1').innerHTML = parseInt(att*(1+0.052*(minslot))*1.15)
            }
            if (minslot != cslot){
               document.getElementById(atttype+'strength1').innerHTML = ''
            }
      }
         tmpc = curCard
         att = tmpc[atttype+'2']
         if (tmpc.attribute != atttype)
               att /= 1.1
            else
               att += kizuna[tmpc.rarity][1]
         skill = (tmpc.skilldetail === undefined ? 0 : skillstrength(tmpc, skilllevel, 1, 1));
         if (tmpc.skilleffect == 11){
            if ((skill*1.5 > att*0.208*1.15) && (cslot >= 4)){
               document.getElementById(atttype+'strength2').innerHTML = parseInt(att*(1+0.052*(cslot-4))*1.15+skill*2.5)+'<br>(加分宝石)'
            }
            else{
               document.getElementById(atttype+'strength2').innerHTML = parseInt(att*(1+0.052*(cslot))*1.15+skill)
            }
         }
         else if (tmpc.skilleffect == 9){

            if ((skill*naipan > att*0.208*1.15) && (cslot >= 4)){
                  document.getElementById(atttype+'strength2').innerHTML = parseInt(att*(1+0.052*(cslot-4))*1.15+skill*naipan)+'<br>(回血宝石)'
               }
               else{
                  document.getElementById(atttype+'strength2').innerHTML = parseInt(att*(1+0.052*(cslot))*1.15)
               }
         }
         else{
            document.getElementById(atttype+'strength2').innerHTML = parseInt(att*(1+0.052*(cslot))*1.15)
         }
      }
      if (need_scroll) comp_cardselector.scrollIntoView();
   }, defaultHandleFailedRequest);
}

function changeskilleffect(c, skilllevel){
    document.getElementById('skilleffecttitle').style.display = ''
    document.getElementById('skilleffect').style.display = ''
    if ((!c.skill) || (c.support == 1) || !LLConst.Skill.isStrengthSupported(c)){
        document.getElementById('skilleffecttitle').style.display = 'none'
        document.getElementById('skilleffect').style.display = 'none'
      document.getElementById('skilleffect2').style.display = 'none'
    }
    else if (c.skilleffect == 11){
        document.getElementById('skilleffecttitle').innerHTML = '加分强度'
        document.getElementById('skilleffect').innerHTML = skillstrength(c, skilllevel, 0, 1)+'<br>修正:'+skillstrength(c, skilllevel, 1, 1)
        document.getElementById('skilleffect2').innerHTML = skillstrength(c, skilllevel, 0, 1)+'<br>修正:'+skillstrength(c, skilllevel, 1, 1)
    }
    else if (c.skilleffect == 9){
        document.getElementById('skilleffecttitle').innerHTML = '回血期望'
        document.getElementById('skilleffect').innerHTML = skillstrength(c, skilllevel)+'/note'+'<br>修正:'+skillstrength(c, skilllevel, 1)+'/note'
        document.getElementById('skilleffect2').innerHTML = skillstrength(c, skilllevel)+'/note'+'<br>修正:'+skillstrength(c, skilllevel, 1)+'/note'
    }
    else if ((c.skilleffect == 4) || (c.skilleffect == 5)){
      document.getElementById('skilleffecttitle').style.display = 'none'
      document.getElementById('skilleffect').style.display = 'none'
      document.getElementById('skilleffect2').style.display = 'none'
    }
}

/** @param {LLH.Depends.Promise<void, void>} loadDeferred */
function renderPage(loadDeferred) {
    // TODO: need load skill data for lowbound filter to work on skill calculation...
    LLCardData.briefKeys.push('minslot', 'maxslot', 'smile2', 'pure2', 'cool2');

    /**
     * @param {LLH.API.CardDictDataType} cardData 
     * @param {LLH.API.MetaDataType} metaData 
     */
    function init(cardData, metaData) {
        LLConst.initMetadata(metaData);
        // init 2 skill containers
        comp_skill = new LLSkillComponent({'id': 'skillcontainer', 'showAll': true});
        comp_skill2 = new LLSkillComponent({'id': 'skillcontainer2', 'showAll': true});
        var origSetSkillLevel = comp_skill.setSkillLevel;
        var newSetSkillLevel = function (lv) {
           if (this.skillLevel == lv) return;
           origSetSkillLevel.call(comp_skill, lv);
           origSetSkillLevel.call(comp_skill2, lv);
           changecolor();
        };
        comp_skill.setSkillLevel = newSetSkillLevel;
        comp_skill2.setSkillLevel = newSetSkillLevel;
     
        // init card selector, with lowbound filter
        comp_cardselector = new LLCardSelectorComponent('card_filter_container', {'cards': cardData, 'pools': LLPoolUtil.loadPools(LLHelperLocalStorageKeys.localStorageCardPoolKey)});
        comp_cardselector.addFilterable('lowbound', new LLValuedComponent('lowbound'));
        comp_cardselector.addFilterCallback('lowbound', 'cardchoice', function (opt, v, d) {
           return (v == '' || isNaN(v) || (!d) || getmaxstrength(d) >= parseInt(v));
        })
        comp_cardselector.onCardChange = function () {
           cslot = -1;
           changecolor();
        };
     
        // init image
        comp_image_avatar = new LLAvatarComponent({'id': 'avatar1', 'smallAvatar': true});
        comp_image_avatar2 = new LLAvatarComponent({'id': 'avatar2', 'smallAvatar': true});
        comp_image_card = new LLImageComponent('card');
        comp_image_card2 = new LLImageComponent('card2');
        comp_image_navi = new LLImageComponent('navi');
        comp_image_navi2 = new LLImageComponent('navi2');
     
        var comp_dataversion = new LLDataVersionSelectorComponent('card_data_version', LLCardData, function (v) {
           LoadingUtil.startSingle(LLCardData.getAllBriefData().then(function (cards) {
              comp_cardselector.setCardData(cards, true);
           }));
        });
     
        comp_language = new LLLanguageComponent('language');
        comp_language.registerLanguageChange(comp_cardselector);
     
        // done
        LoadingUtil.stop();
    }

    LLDepends.whenAll(LLCardData.getAllBriefData(), LLMetaData.get(), loadDeferred).then(
        init,
        defaultHandleFailedRequest
    );
    
}
