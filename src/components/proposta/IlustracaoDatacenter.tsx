// Ilustração de data center (racks + turbina eólica) da seção Confiança.
export function IlustracaoDatacenter() {
  return (
<svg viewBox="0 0 460 300" aria-hidden="true">
          <ellipse cx="220" cy="272" rx="200" ry="16" fill="#E4ECFA"/>
          <circle cx="410" cy="46" r="17" fill="#F4D77A"/>
          <g stroke="#E3B94A" strokeWidth="3" strokeLinecap="round"><path d="M410 14v8M410 70v8M378 46h8M434 46h8M387 23l6 6M427 63l6 6M433 23l-6 6M393 63l-6 6"/></g>
          <g id="racks">
            <g><rect x="40" y="62" width="104" height="200" rx="9" fill="#E3E9F4" stroke="#0D1B3E" strokeWidth="3"/>
              <g fill="#fff" stroke="#B0B8C1" strokeWidth="2"><rect x="50" y="74" width="84" height="22" rx="4"/><rect x="50" y="102" width="84" height="22" rx="4"/><rect x="50" y="130" width="84" height="22" rx="4"/><rect x="50" y="158" width="84" height="22" rx="4"/><rect x="50" y="186" width="84" height="22" rx="4"/><rect x="50" y="214" width="84" height="22" rx="4"/></g>
              <g><circle className="led2" cx="62" cy="85" r="3.4" fill="#3BB273"/><circle className="led2" cx="62" cy="113" r="3.4" fill="#C9A84C" style={{animationDelay:'.4s'}}/><circle className="led2" cx="62" cy="141" r="3.4" fill="#3BB273" style={{animationDelay:'.9s'}}/><circle className="led2" cx="62" cy="169" r="3.4" fill="#3BB273" style={{animationDelay:'1.3s'}}/><circle className="led2" cx="62" cy="197" r="3.4" fill="#C9A84C" style={{animationDelay:'.2s'}}/><circle className="led2" cx="62" cy="225" r="3.4" fill="#3BB273" style={{animationDelay:'1.6s'}}/></g>
              <path d="M76 85h44M76 113h44M76 141h30M76 169h44M76 197h36M76 225h44" stroke="#C7CEDB" strokeWidth="3" strokeLinecap="round"/></g>
            <g><rect x="158" y="62" width="104" height="200" rx="9" fill="#E3E9F4" stroke="#0D1B3E" strokeWidth="3"/>
              <g fill="#fff" stroke="#B0B8C1" strokeWidth="2"><rect x="168" y="74" width="84" height="22" rx="4"/><rect x="168" y="102" width="84" height="22" rx="4"/><rect x="168" y="130" width="84" height="22" rx="4"/><rect x="168" y="158" width="84" height="22" rx="4"/><rect x="168" y="186" width="84" height="22" rx="4"/><rect x="168" y="214" width="84" height="22" rx="4"/></g>
              <g><circle className="led2" cx="180" cy="85" r="3.4" fill="#C9A84C" style={{animationDelay:'.7s'}}/><circle className="led2" cx="180" cy="113" r="3.4" fill="#3BB273" style={{animationDelay:'.1s'}}/><circle className="led2" cx="180" cy="141" r="3.4" fill="#3BB273" style={{animationDelay:'1.1s'}}/><circle className="led2" cx="180" cy="169" r="3.4" fill="#C9A84C" style={{animationDelay:'.5s'}}/><circle className="led2" cx="180" cy="197" r="3.4" fill="#3BB273" style={{animationDelay:'1.5s'}}/><circle className="led2" cx="180" cy="225" r="3.4" fill="#3BB273" style={{animationDelay:'.3s'}}/></g>
              <path d="M194 85h44M194 113h30M194 141h44M194 169h36M194 197h44M194 225h28" stroke="#C7CEDB" strokeWidth="3" strokeLinecap="round"/></g>
            <g><rect x="276" y="62" width="104" height="200" rx="9" fill="#E3E9F4" stroke="#0D1B3E" strokeWidth="3"/>
              <g fill="#fff" stroke="#B0B8C1" strokeWidth="2"><rect x="286" y="74" width="84" height="22" rx="4"/><rect x="286" y="102" width="84" height="22" rx="4"/><rect x="286" y="130" width="84" height="22" rx="4"/><rect x="286" y="158" width="84" height="22" rx="4"/><rect x="286" y="186" width="84" height="22" rx="4"/><rect x="286" y="214" width="84" height="22" rx="4"/></g>
              <g><circle className="led2" cx="298" cy="85" r="3.4" fill="#3BB273" style={{animationDelay:'1s'}}/><circle className="led2" cx="298" cy="113" r="3.4" fill="#3BB273" style={{animationDelay:'.2s'}}/><circle className="led2" cx="298" cy="141" r="3.4" fill="#C9A84C" style={{animationDelay:'.8s'}}/><circle className="led2" cx="298" cy="169" r="3.4" fill="#3BB273" style={{animationDelay:'1.4s'}}/><circle className="led2" cx="298" cy="197" r="3.4" fill="#C9A84C" style={{animationDelay:'.6s'}}/><circle className="led2" cx="298" cy="225" r="3.4" fill="#3BB273"/></g>
              <path d="M312 85h44M312 113h36M312 141h44M312 169h28M312 197h44M312 225h40" stroke="#C7CEDB" strokeWidth="3" strokeLinecap="round"/></g>
          </g>
          <rect x="130" y="14" width="130" height="30" rx="15" fill="#0D1B3E"/>
          <text x="195" y="34" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="14" letterSpacing="2" fill="#C9A84C">TIER III</text>
          <path d="M424 270V160" stroke="#0D1B3E" strokeWidth="4" strokeLinecap="round"/>
          <g className="spin" style={{transformOrigin:'424px 156px'}}><path d="M424 156V118M424 156l33 19M424 156l-33 19" stroke="#0D1B3E" strokeWidth="4" strokeLinecap="round"/></g>
          <circle cx="424" cy="156" r="6" fill="#C9A84C" stroke="#0D1B3E" strokeWidth="3"/>
        </svg>
  );
}
