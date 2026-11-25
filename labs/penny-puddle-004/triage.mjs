/**
 * Advisory candidate screening. Rules point to questions, not coin valuations.
 * Observations are user-reported, not certified composition or authentication.
 */
const validFaces=new Set([1,5,10,25,50,100]);
export function screenCoinCandidate({ denominationCents, observedYear, reportedFeatures = [] }) {
  if(!validFaces.has(denominationCents))throw new TypeError('Unsupported U.S. coin denomination');
  if(!Number.isSafeInteger(observedYear) || observedYear<1790 || observedYear>2100)
    throw new TypeError('Use an explicitly observed year');
  if(!Array.isArray(reportedFeatures) || reportedFeatures.length>20 ||
     !reportedFeatures.every(x=>typeof x==='string' && x.length<=80))
    throw new TypeError('Invalid feature observations');
  const features=new Set(reportedFeatures.map(x=>x.trim().toLowerCase()));
  const flags=[];
  const add=(code,reason)=>flags.push({code,reason,unverified:true});
  if(denominationCents===1){
    if(observedYear===1943 && features.has('copper-like'))
      add('1943-off-metal-candidate','1943 U.S. one-cent coins were ordinarily zinc-coated steel; copper-like observations require independent authentication and counterfeit checks.');
    if(observedYear===1944 && features.has('steel-like'))
      add('1944-off-metal-candidate','An unusual steel-like 1944 cent requires expert authentication; visual color alone proves nothing.');
    if(observedYear===1955 && features.has('doubled-lettering'))
      add('1955-doubled-die-candidate','Some 1955 Lincoln cents have collectible doubled dies, but machine doubling, altered pieces and counterfeits exist.');
    if(observedYear===1909 && features.has('s-mintmark') && features.has('vdb-initials'))
      add('1909-s-vdb-candidate','A claimed 1909-S VDB cent needs date, mintmark, initials and independent authentication review.');
    if(observedYear<=1958 && observedYear>=1909 && features.has('wheat-reverse'))
      add('wheat-cent-observation','An older design may deserve inspection; many wheat cents are common and do not command large premiums.');
  }
  if([10,25,50].includes(denominationCents) && observedYear<=1964 && observedYear>=1900)
    add('silver-era-composition-review','Some U.S. dimes, quarters and half dollars dated before 1965 have silver content; verify type, authenticity, ownership and applicable law, not just date.');
  if(denominationCents===50 && observedYear>=1965 && observedYear<=1970)
    add('1965-1970-half-dollar-review','Certain half dollars of these dates contain silver; confirm type and condition independently.');
  return {
    denominationCents,observedYear,
    disposition:flags.length?'quarantine-for-human-review':'no-rule-match-review-still-optional',
    flags,
    isAuthenticated:false,hasPriceEstimate:false,ownerRightsTransferred:false,
    noCleanOrPolish:true,
    note:'Screening rules are incomplete. No flag is proof of rarity; no flags do not prove a coin is ordinary. Never grade, clean, price or sell automatically.'
  };
}
