#include <iostream>
#include<fstream>
using namespace std;
int n ;
typedef  long long ll;

ll arr[1000];
double ans[1000];
int main(int argc, char * argv[]){
	int n;
	ifstream in(argv[1]);
	
	in>>n;
	for(int i=0;i<n; i++){
		in>>arr[i];
	}
	ofstream out(argv[2]);
	ll sum =0;
	for(int i=0; i<n; i++){
		sum+=arr[i];
	}
	out<<sum<<endl;
	for(int i=0;i<n; i++){
		ans[i]=(1.0*arr[i])/((double)sum);
		out<<ans[i]<<" "<<endl;
	}
	
	
}
