"use client";

const Phone = (props:any) => {

    return (
        <div className="phone" style={{backgroundColor: props.backgroundColor}}>
            {props.children}
        </div>
    );
}

export default Phone;