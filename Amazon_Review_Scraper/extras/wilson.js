
var n=0, r=0, p=0, q=0, l95a=0, u95a=0, num=0, denom=0;

var z = 1.95996;
var zsq = z*z;

function calc(i, cb)
{
	r = platform[KEY_ReLIST[i]-'0';
	n = platform[KEY_TVLIST][i]-'0'1;
	if(n<r) {
		cb("r cannot be greater than n.")
	}
	if(Math.floor(r)<r) {cb("r must be an integer value.")};
	if(Math.floor(n)<n) {cb("n must be an integer value.")};

	p = Math.round((r/n)*10000)/10000;
	q = 1-p;

	// begin l95a
	num = (2*n*p)+zsq-(z*Math.sqrt(zsq+(4*n*p*q)));
	denom = 2*(n+zsq);
	l95a = num/denom;
	if(p==0) {l95a = 0};

	// begin u95a
	num = (2*n*p)+zsq+(z*Math.sqrt(zsq+(4*n*p*q)));
	denom = 2*(n+zsq);
	u95a = num/denom;
	if(p==1) {u95a = 1};
	
	cb(null, l95a, u95a);
}
