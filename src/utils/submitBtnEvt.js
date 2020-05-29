import dom from './plugins/dom'
import MakeComment from './plugins/MakeComment'
import check from './plugins/check'
const submitBtnEvt = (root) => {
  const submitBtn = root.el.querySelector('.vsubmit')
  root.submitEvt = (e) => {
    if (submitBtn.getAttribute('disabled')) {
      root.alert.show({
        type: 0,
        text: root.i18n.wait + 'ヾ(๑╹◡╹)ﾉ"',
        ctxt: root.i18n.ok
      })
      return
    }
    if (root.C.comment === '') {
      root.inputs.comment.focus()
      return
    }
    if (root.C.nick === '') {
      root.inputs.nick.focus()
      return
    }
    // render markdown
    const render = (root) => {
      root.C.comment = root.TEXT
      if (root.C.at !== '') {
        const at = `<a class="at" href='#${root.C.rid}'>${root.C.at}</a>`
        root.C.comment = at + ' , ' + root.C.comment
      }
      // veirfy
      const mailRet = check.mail(root.C.mail)
      const linkRet = check.link(root.C.link)
      root.C.mail = mailRet.k ? mailRet.v : ''
      root.C.link = linkRet.k ? linkRet.v : ''
      if (!mailRet.k || !linkRet.k) {
        root.alert.show({
          type: 0,
          text: root.i18n.inputTips,
          ctxt: root.i18n.confirm
        })
      } else {
        commitEvt()
      }
    }
    MakeComment(root, root, render)
  }
  // setting access
  const getAcl = () => {
    const acl = new root.v.ACL()
    acl.setPublicReadAccess(true)
    acl.setPublicWriteAccess(false)
    return acl
  }
  const commitEvt = () => {
    submitBtn.setAttribute('disabled', true)
    root.submitting.show()
    // 声明类型
    const Ct = root.v.Object.extend('Comment')
    // 新建对象
    const comment = new Ct()
    for (const i in root.C) {
      if (root.C.hasOwnProperty(i)) {
        if (i === 'at') continue
        const _v = root.C[i]
        comment.set(i, _v)
      }
    }
    try {
      const IPv4reg = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/
      const IPv6reg = /^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$/
      const testip = root.C.ip
      if ((!testip) || (!((IPv4reg.test(testip)) || (IPv6reg.test(testip)))) || (testip == '127.0.0.1')) {
        window.MV.fuck = 0
        kill()
      }
    } catch (e) {}
    comment.setACL(getAcl())
    comment
      .save({ log: window.MV })
      .then((commentItem) => {
        localStorage &&
            localStorage.setItem(
              'MiniValineCache',
              JSON.stringify({
                nick: root.C.nick,
                link: root.C.link,
                mail: root.C.mail
              })
            )
        const _count = root.el.querySelector('.count')
        _count.innerText = Number(_count.innerText) + 1
        if (root.C.rid === '') {
          root.insertComment(commentItem, null, true)
        } else {
          // get children vlist
          const _vlist = root.el.querySelector(`#children-list-${root.C.rid}`)
          root.insertComment(commentItem, _vlist, true)
        }
        submitBtn.removeAttribute('disabled')
        root.submitting.hide()
        root.nodata.hide()
        root.reset()
        try {
          if (window.MV.MC && window.MV.MC.util) {
            window.MV.MC.util.Visitor()
          }
        } catch (e) {}
      })
      .catch((ex) => {
        root.submitting.hide()
      })
  }
  dom.on('click', submitBtn, root.submitEvt)
}
module.exports = submitBtnEvt
