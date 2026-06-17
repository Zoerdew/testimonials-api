;/*FB_PKG_DELIM*/

__d("AdsCreativeVideoGenOfflineToastStorage",["WebStorage"],(function(t,n,r,o,a,i,l){"use strict";var e,s="offline_api_returned_videos.";function u(e,t){return s+(e!=null?e:"")+"."+(t!=null?t:"")+".0"}function c(t,n){var o=(e||(e=r("WebStorage"))).getLocalStorage();o!=null&&o.setItem(u(t,n),"true")}l.markOfflineApiReturnedVideos=c}),98);