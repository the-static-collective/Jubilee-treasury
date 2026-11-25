"""Bounded question workshop. No external source queries or authority."""
import json, sys, re
from vendor.motif_grammar import Grammar, interpret, LEVELS
from vendor.hinge_dogram import exact_relation_delta

def review(data):
    if type(data) is not dict or set(data) != {"factors","observations","validation","budget"}:
        raise ValueError("Closed question contract required")
    names=data["factors"]
    if type(names) is not list or len(names)!=5 or any(type(x) is not str or not re.fullmatch(r"[a-z][a-z0-9_-]{0,39}",x) for x in names) or len(set(names))!=5:
        raise ValueError("Exactly five distinct abstract factor tokens")
    budget=data["budget"]
    if type(budget) is not int or budget not in LEVELS: raise ValueError("Invalid AST budget")
    def labels(rows):
        if type(rows) is not list or len(rows)>32: raise ValueError("Bounded observations required")
        out={}
        for row in rows:
            if type(row) is not dict or set(row)!={"mask","outcome"} or type(row["mask"]) is not int or not 0<=row["mask"]<32 or type(row["outcome"]) is not bool or row["mask"] in out:
                raise ValueError("Invalid or repeated observation")
            out[row["mask"]]=row["outcome"]
        return out
    train=labels(data["observations"]); validation=labels(data["validation"])
    if set(train)&set(validation): raise ValueError("Training and validation must be disjoint")
    if not train: raise ValueError("At least one development observation required")
    g=Grammar(); candidates=g.candidates(budget,train)
    out={"schema":"jubilee.growth.question/v1","authority":"none","status":"HOLD","grammar":"five-variable monotone AND/OR","factorOrder":names,"enumeratedFunctions":sum(cost<=budget for cost,_ in g.expressions.values()),"remaining":len(candidates),"nextQuestion":None,"method":None,"delta":None,"validation":None,"executionAllowed":False}
    if not candidates:
        out["result"]="GRAMMAR_GAP";out["refutations"]=g.gaps(budget,train);return out
    if len(candidates)>1:
        choices=[]
        for mask in range(32):
            if mask in train or mask in validation:continue
            yes=sum(bool(sig&(1<<mask)) for sig in candidates)
            if 0<yes<len(candidates):choices.append((min(yes,len(candidates)-yes),mask,yes))
        if choices:
            score,mask,yes=max(choices,key=lambda x:(x[0],-x[1]))
            out["nextQuestion"]={"mask":mask,"present":[n for i,n in enumerate(names) if mask&(1<<i)],"absent":[n for i,n in enumerate(names) if not mask&(1<<i)],"yesCandidates":yes,"noCandidates":len(candidates)-yes,"worstCaseEliminated":score}
        out["result"]="ASK" if choices else "AMBIGUOUS_HOLD";return out
    sig=candidates[0]; cost,ast=g.expressions[sig]
    # Native interpreter checks the whole bounded truth table; independent
    # validation is never used to choose or modify the program.
    if any(interpret(ast,m)!=bool(sig&(1<<m)) for m in range(32)):raise ValueError("Native interpretation mismatch")
    passed=sum(interpret(ast,m)==v for m,v in validation.items())
    out["validation"]={"tested":len(validation),"passed":passed,"usedInSearch":False}
    if len(validation)<2:out["result"]="VALIDATION_REQUIRED";return out
    if passed!=len(validation):out["result"]="VALIDATION_FAILED";return out
    method={"ast":ast,"cost":cost,"signature":f"{sig:08x}"}
    out["method"]=method
    out["delta"]=exact_relation_delta([], [{"selector":"candidate-question","relation":json.dumps(method,sort_keys=True,separators=(",",":"))}])
    out["result"]="METHOD_PREVIEW";return out

def fixture():
    # Fictional monotone rule; keep two labels out of the search.
    return {"factors":["document","translation","review","transport","permission"],"budget":11,
            "observations":[{"mask":m,"outcome":bool(m&1 and m&2)} for m in range(32) if m not in (0,31)],
            "validation":[{"mask":0,"outcome":False},{"mask":31,"outcome":True}]}
if __name__=="__main__":
    data=fixture() if sys.argv[1:]==["--fixture"] else json.loads(sys.stdin.read(20001))
    print(json.dumps(review(data),sort_keys=True))
