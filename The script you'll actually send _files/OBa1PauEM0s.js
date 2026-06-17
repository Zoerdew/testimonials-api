;/*FB_PKG_DELIM*/

__d("AdsPGFBAYADateUtils",["DateTime","Timezone"],(function(t,n,r,o,a,i,l){"use strict";function e(e){return r("DateTime").fromISOString(e,o("Timezone").UTC).format("F d, Y")}function s(e){return r("DateTime").fromISOString(e,o("Timezone").UTC).format("F Y")}l.formatDateWithDateMonthYear=e,l.formatDateWithMonthYear=s}),98);