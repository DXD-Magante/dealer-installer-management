import React, { useEffect, useState, useRef } from 'react';
import { db, auth } from "../services/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";
import Lottie from 'react-lottie';
import animationData from "./refer.json";

import '../styles/components/ReferralPage.css';

const ReferralPage = () => {
  const [referralId, setReferralId] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [rewardCount, setRewardCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false); // Modal visibility state
  const qrCodeRef = useRef(null);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const userDoc = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userDoc);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        setReferralId(userData.referralId || 'N/A');
        fetchReferrals(userData.referralId);
      } else {
        console.error('No such document!');
      }
    } catch (error) {
      console.error('Error fetching referral ID:', error);
    }
  };

  const fetchReferrals = async (referralId) => {
    try {
      const referralsQuery = query(
        collection(db, 'users'),
        where('referredBy', '==', referralId)
      );
      const referralSnapshot = await getDocs(referralsQuery);
      const referralsList = referralSnapshot.docs.map((doc) => doc.data());
      setReferrals(referralsList);
      setRewardCount(referralsList.length * 10); // Assuming each referral gives 10 points
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const link = `/signup?ref=${referralId}`;
    navigator.clipboard.writeText(link)
      .then(() => alert('Referral link copied to clipboard!'))
      .catch(err => console.error('Error copying referral link:', err));
  };

  const shareQRCode = async () => {
    try {
      const canvas = qrCodeRef.current.querySelector('canvas');
      const qrImage = canvas.toDataURL('image/png'); // Generate image data from the QR code canvas

      const blob = await (await fetch(qrImage)).blob(); // Convert the image data URL to a Blob
      const file = new File([blob], 'referral-qr-code.png', { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Join us using my referral code!',
          text: 'Use my referral code "${referralId}" to sign up and get started!',
          files: [file],
        });
      } else {
        alert('Sharing not supported on this device or browser.');
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
    }
  };

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  };

  return (
    <div className="container">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <Lottie options={defaultOptions} height={220} width={220} />

          <h2 className="title">Your Unique Referral Code</h2>

          <div className="referral-container">
            <p className="referral-text">{referralId || 'Loading...'}</p>
          </div>

          <div className="actions-container">
            <button className="action-button" onClick={copyToClipboard}>
              Copy referral
            </button>
            <button className="action-button" onClick={shareQRCode}>Share referral</button>
            <button
              className="action-button"
              onClick={() => setShowQRCodeModal(true)}
            >
              Show QR Code
            </button>
          </div>

          <div className="rewards-container">
            <h3>Total Rewards</h3>
            <p>{rewardCount} Points</p>
            <p>Invite more friends to earn more rewards!</p>
          </div>

          <div className="referrals-history">
            <h3>Referral History</h3>
            {referrals.length > 0 ? (
              <ul>
                {referrals.map((referral, index) => (
                  <li key={index}>
                    {referral.name || 'Unknown User'} - {referral.email || 'Email not provided'}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No referrals yet. Start sharing your code!</p>
            )}
          </div>

          {/* QR Code Modal */}
          {showQRCodeModal && (
            <div className="qr-code-modal">
              <div className="modal-content">
                <button
                  className="close-button"
                  onClick={() => setShowQRCodeModal(false)}
                >
                  ×
                </button>
                <h3>Scan this QR Code</h3>
                <QRCodeCanvas
                  value={`/signup?ref=${referralId}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReferralPage;
