import React from 'react';

export default function CommissionStructure() {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-heading font-bold text-gray-800 mb-4">Commission Structure</h2>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                <span className="text-primary-700 font-medium">1</span>
              </div>
              <h3 className="font-medium text-gray-800">First Upline</h3>
            </div>
            <div className="text-3xl font-bold text-primary-700 mb-1">20%</div>
            <p className="text-sm text-gray-600">Commission on direct referrals</p>
          </div>
          
          <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                <span className="text-primary-700 font-medium">2</span>
              </div>
              <h3 className="font-medium text-gray-800">Second Upline</h3>
            </div>
            <div className="text-3xl font-bold text-primary-700 mb-1">10%</div>
            <p className="text-sm text-gray-600">Commission on second-level referrals</p>
          </div>
          
          <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                <span className="text-primary-700 font-medium">3</span>
              </div>
              <h3 className="font-medium text-gray-800">Third Upline</h3>
            </div>
            <div className="text-3xl font-bold text-primary-700 mb-1">5%</div>
            <p className="text-sm text-gray-600">Commission on third-level referrals</p>
          </div>
        </div>
        
        <div className="mt-5 pt-5 border-t border-gray-100">
          <h4 className="font-medium text-gray-800 mb-2">How it works:</h4>
          <p className="text-gray-600 text-sm mb-3">
            When someone uses your referral code to register and becomes an Active User by paying the $100 activation fee, you'll earn a 20% commission ($20). Your upline will also earn 10%, and their upline will earn 5%.
          </p>
          <p className="text-gray-600 text-sm">
            Similarly, if they become an Affiliator User by paying $250, you'll earn 20% ($50), your upline will earn 10% ($25), and their upline will earn 5% ($12.50).
          </p>
        </div>
      </div>
    </div>
  );
}
